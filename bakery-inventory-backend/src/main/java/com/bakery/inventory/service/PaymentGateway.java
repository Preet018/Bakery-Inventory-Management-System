package com.bakery.inventory.service;

import com.bakery.inventory.dto.payment.PaymentGatewayOrder;
import com.bakery.inventory.dto.payment.PaymentGatewayRefund;
import com.bakery.inventory.dto.payment.PaymentGatewayVerification;

import java.math.BigDecimal;

public interface PaymentGateway {
    PaymentGatewayOrder createOrder(Integer internalOrderId, BigDecimal amount, String currency);

    PaymentGatewayVerification verifyPayment(String providerOrderId, String providerPaymentId, String providerSignature, BigDecimal expectedAmount, String expectedCurrency);

    PaymentGatewayRefund initiateRefund(String providerPaymentId, BigDecimal amount, String currency, String receipt, String idempotencyKey);

    PaymentGatewayRefund initiateRefund(String providerPaymentId, BigDecimal amount, String currency, String receipt);
}