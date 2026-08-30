package com.bakery.inventory.service;

import com.bakery.inventory.dto.payment.PaymentGatewayOrder;
import com.bakery.inventory.dto.payment.PaymentGatewayRefund;
import com.bakery.inventory.dto.payment.PaymentGatewayVerification;
import com.bakery.inventory.exception.PaymentGatewayException;
import com.razorpay.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayPaymentGateway implements PaymentGateway {
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Override
    public PaymentGatewayOrder createOrder(Integer internalOrderId, BigDecimal amount, String currency) {
        long amountInPaise = amount
                        .movePointRight(2)
                        .setScale(0, RoundingMode.UNNECESSARY)
                        .longValueExact();

        JSONObject orderRequest = new JSONObject();

        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", "ORDER_" + internalOrderId);

        try {
            Order razorpayOrder = razorpayClient.orders.create(orderRequest);

            return new PaymentGatewayOrder(razorpayOrder.get("id"), keyId);
        } catch (RazorpayException e) {
            throw new PaymentGatewayException(
                    "Failed to create Razorpay order for internal order " + internalOrderId, e
            );
        }
    }

    @Override
    public PaymentGatewayVerification verifyPayment(String providerOrderId, String providerPaymentId, String providerSignature, BigDecimal expectedAmount, String expectedCurrency) {
        JSONObject signatureAttributes = new JSONObject();

        signatureAttributes.put("razorpay_order_id", providerOrderId);

        signatureAttributes.put("razorpay_payment_id", providerPaymentId);

        signatureAttributes.put("razorpay_signature", providerSignature);

        try {
            boolean signatureValid = Utils.verifyPaymentSignature(signatureAttributes, keySecret);

            if (!signatureValid) {
                return new PaymentGatewayVerification(
                        providerPaymentId,
                        false
                );
            }

            Payment razorpayPayment = razorpayClient.payments.fetch(providerPaymentId);

            String actualOrderId = razorpayPayment.get("order_id");

            String status = razorpayPayment.get("status");

            String actualCurrency = razorpayPayment.get("currency");

            long actualAmount = ((Number) razorpayPayment.get("amount")).longValue();

            long expectedAmountInPaise = expectedAmount
                            .movePointRight(2)
                            .setScale(
                                    0,
                                    RoundingMode.UNNECESSARY
                                )
                            .longValueExact();

            if (!providerOrderId.equals(actualOrderId)) {
                return new PaymentGatewayVerification(
                        providerPaymentId,
                        false
                );
            }

            if (actualAmount != expectedAmountInPaise) {
                return new PaymentGatewayVerification(
                        providerPaymentId,
                        false
                );
            }

            if (!expectedCurrency.equals(actualCurrency)) {
                return new PaymentGatewayVerification(
                        providerPaymentId,
                        false
                );
            }

            boolean captured = "captured".equalsIgnoreCase(status);

            return new PaymentGatewayVerification(
                    providerPaymentId,
                    captured
            );
        } catch (RazorpayException e) {
            throw new PaymentGatewayException(
                    "Failed to verify Razorpay payment " + providerPaymentId, e
            );
        }
    }

    @Override
    public PaymentGatewayRefund initiateRefund(String providerPaymentId, BigDecimal amount, String currency, String receipt, String idempotencyKey) {
        long expectedAmountInPaise = amount
                .movePointRight(2)
                .setScale(0, RoundingMode.UNNECESSARY)
                .longValueExact();

        try {
            // 1. Existing-refund reconciliation: Query existing refunds for this payment
            List<Refund> existingRefunds = null;
            try {
                existingRefunds = razorpayClient.payments.fetchAllRefunds(providerPaymentId);
            } catch (Exception fetchEx) {
                log.debug("Could not fetch existing refunds for payment {}: {}", providerPaymentId, fetchEx.getMessage());
            }

            if (existingRefunds != null && !existingRefunds.isEmpty()) {
                for (Refund existingRefund : existingRefunds) {
                    String refundId = existingRefund.get("id");
                    String refundStatus = null;
                    try {
                        Object s = existingRefund.get("status");
                        if (s != null) refundStatus = s.toString();
                    } catch (Exception ignored) {}

                    boolean isFailed = "failed".equalsIgnoreCase(refundStatus);
                    if (!isFailed) {
                        return new PaymentGatewayRefund(refundId, refundStatus != null ? refundStatus : "processed", true);
                    }
                }
            }

            // 2. Prepare refund request payload with receipt and deterministic metadata
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", expectedAmountInPaise);
            if (receipt != null) {
                refundRequest.put("receipt", receipt);
                JSONObject notes = new JSONObject();
                notes.put("receipt", receipt);
                if (idempotencyKey != null) {
                    notes.put("idempotencyKey", idempotencyKey);
                }
                refundRequest.put("notes", notes);
            }

            // 3. API-level idempotency header: set X-Razorpay-Idempotency-Key
            Refund refund;
            synchronized (razorpayClient) {
                if (idempotencyKey != null) {
                    razorpayClient.addHeaders(Collections.singletonMap("X-Razorpay-Idempotency-Key", idempotencyKey));
                }
                refund = razorpayClient.payments.refund(providerPaymentId, refundRequest);
            }

            String refundId = refund.get("id");
            String refundStatus = null;
            try {
                Object s = refund.get("status");
                if (s != null) refundStatus = s.toString();
            } catch (Exception ignored) {}

            boolean isSuccessful = !"failed".equalsIgnoreCase(refundStatus);

            return new PaymentGatewayRefund(refundId, refundStatus != null ? refundStatus : "processed", isSuccessful);
        } catch (RazorpayException e) {
            // If Razorpay reports duplicate receipt or already refunded, reconcile as successfully refunded
            String err = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (err.contains("duplicate receipt") || err.contains("already refunded") || err.contains("duplicate")) {
                log.info("Razorpay reported duplicate receipt/refund for payment {}. Treating as successfully reconciled.", providerPaymentId);
                String refundId = "reconciled_" + providerPaymentId;
                try {
                    List<Refund> existingRefunds = razorpayClient.payments.fetchAllRefunds(providerPaymentId);
                    if (existingRefunds != null && !existingRefunds.isEmpty()) {
                        Refund first = existingRefunds.get(0);
                        String fId = first.get("id");
                        String fStatus = null;
                        try {
                            Object s = first.get("status");
                            if (s != null) fStatus = s.toString();
                        } catch (Exception ignored) {}
                        return new PaymentGatewayRefund(fId != null ? fId : refundId, fStatus != null ? fStatus : "processed", true);
                    }
                } catch (Exception ignored) {}
                return new PaymentGatewayRefund(refundId, "processed", true);
            }

            throw new PaymentGatewayException(
                    "Failed to process Razorpay refund for payment " + providerPaymentId + ": " + e.getMessage(), e
            );
        }
    }

    @Override
    public PaymentGatewayRefund initiateRefund(String providerPaymentId, BigDecimal amount, String currency, String receipt) {
        String derivedIdempotencyKey = receipt != null
                ? receipt + "_PAYMENT_" + providerPaymentId
                : "PAYMENT_" + providerPaymentId + "_REFUND";
        return initiateRefund(providerPaymentId, amount, currency, receipt, derivedIdempotencyKey);
    }
}