package com.bakery.inventory.service;

import com.bakery.inventory.dto.payment.PaymentGatewayOrder;
import com.bakery.inventory.dto.payment.PaymentGatewayVerification;
import com.bakery.inventory.exception.PaymentGatewayException;
import com.razorpay.*;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

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
}