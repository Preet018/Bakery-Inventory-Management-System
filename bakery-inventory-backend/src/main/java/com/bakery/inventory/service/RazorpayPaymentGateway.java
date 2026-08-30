package com.bakery.inventory.service;

import com.bakery.inventory.dto.payment.PaymentGatewayOrder;
import com.bakery.inventory.dto.payment.PaymentGatewayRefund;
import com.bakery.inventory.dto.payment.PaymentGatewayVerification;
import com.bakery.inventory.exception.PaymentGatewayException;
import com.razorpay.*;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
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
            List<Refund> existingRefunds = razorpayClient.payments.fetchAllRefunds(providerPaymentId);
            if (existingRefunds != null && !existingRefunds.isEmpty()) {
                for (Refund existingRefund : existingRefunds) {
                    String existingReceipt = existingRefund.get("receipt");
                    long existingAmount = ((Number) existingRefund.get("amount")).longValue();
                    String refundStatus = existingRefund.get("status");

                    // POSITIVE ORDER-SPECIFIC ASSOCIATION:
                    // Must strictly match the order's stable receipt identifier and expected amount.
                    // Amount alone with a null/missing receipt must NEVER establish association.
                    boolean receiptMatches = (receipt != null && receipt.equals(existingReceipt));
                    boolean amountMatches = (existingAmount == expectedAmountInPaise);

                    if (receiptMatches && amountMatches) {
                        String refundId = existingRefund.get("id");
                        // ONLY 'processed' status represents a completed/successful refund. 'pending' is NOT completed.
                        boolean isCompleted = "processed".equalsIgnoreCase(refundStatus);
                        return new PaymentGatewayRefund(refundId, refundStatus, isCompleted);
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
            String refundStatus = refund.get("status");
            // ONLY 'processed' status represents a completed/successful refund. 'pending' is NOT completed.
            boolean isCompleted = "processed".equalsIgnoreCase(refundStatus);

            return new PaymentGatewayRefund(refundId, refundStatus, isCompleted);
        } catch (RazorpayException e) {
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