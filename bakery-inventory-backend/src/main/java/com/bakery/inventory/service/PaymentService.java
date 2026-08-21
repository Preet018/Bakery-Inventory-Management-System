package com.bakery.inventory.service;

import com.bakery.inventory.dto.payment.PaymentResponse;
import com.bakery.inventory.dto.payment.PaymentVerificationRequest;
import com.bakery.inventory.entity.PaymentMethod;

public interface PaymentService {
    PaymentResponse createPayment(Integer orderId, PaymentMethod paymentMethod, java.math.BigDecimal amount);

    PaymentResponse getPaymentByOrderId(Integer orderId);

    PaymentResponse verifyAndConfirmPayment(Integer paymentId, PaymentVerificationRequest request);

    PaymentResponse markAsFailed(Integer paymentId);
}