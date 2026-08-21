package com.bakery.inventory.service;

import com.bakery.inventory.dto.payment.PaymentGatewayOrder;
import com.bakery.inventory.dto.payment.PaymentGatewayVerification;
import com.bakery.inventory.dto.payment.PaymentResponse;
import com.bakery.inventory.dto.payment.PaymentVerificationRequest;
import com.bakery.inventory.entity.*;
import com.bakery.inventory.repository.CustomerOrderRepository;
import com.bakery.inventory.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private static final String PAYMENT_PROVIDER = "RAZORPAY";
    private static final String PAYMENT_CURRENCY = "INR";

    private final InventoryReservationService inventoryReservationService;
    private final PaymentGateway paymentGateway;
    private final PaymentRepository paymentRepository;
    private final CustomerOrderRepository customerOrderRepository;

    @Override
    @Transactional
    public PaymentResponse createPayment(Integer orderId, PaymentMethod paymentMethod, BigDecimal amount) {
        CustomerOrder order = customerOrderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found with id: "
                                                + orderId
                                )
                        );

        Payment payment = new Payment();

        payment.setOrder(order);
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment.setProvider(PAYMENT_PROVIDER);
        payment.setAmount(amount);
        payment.setCurrency(PAYMENT_CURRENCY);

        LocalDateTime now = LocalDateTime.now();

        payment.setCreatedAt(now);
        payment.setUpdatedAt(now);

        PaymentGatewayOrder gatewayOrder =
                paymentGateway.createOrder(
                        orderId,
                        amount,
                        PAYMENT_CURRENCY
                );

        // CHANGE: Store Razorpay's provider order ID.
        payment.setProviderOrderId(
                gatewayOrder.getProviderOrderId()
        );

        Payment savedPayment =
                paymentRepository.save(payment);

        return mapToResponse(
                savedPayment,
                gatewayOrder.getProviderKeyId()
        );
    }

    @Override
    public PaymentResponse getPaymentByOrderId(Integer orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Payment not found for order id: "
                                                + orderId
                                )
                        );

        return mapToResponse(payment, null);
    }

    @Override
    @Transactional
    public PaymentResponse verifyAndConfirmPayment(Integer paymentId, PaymentVerificationRequest request) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Payment not found with id: "
                                                + paymentId
                                )
                        );

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            return mapToResponse(payment, null);
        }

        if (payment.getPaymentStatus() == PaymentStatus.FAILED) {
            throw new RuntimeException(
                    "Failed payment cannot be confirmed"
            );
        }

        if (!payment.getProviderOrderId().equals(request.getRazorpayOrderId())) {
            throw new RuntimeException(
                    "Razorpay order does not match payment"
            );
        }

        PaymentGatewayVerification verification = paymentGateway.verifyPayment(
                        payment.getProviderOrderId(),
                        request.getRazorpayPaymentId(),
                        request.getRazorpaySignature(),
                        payment.getAmount(),
                        payment.getCurrency()
                );

        if (!verification.isVerified()) {
            throw new RuntimeException(
                    "Razorpay payment verification failed"
            );
        }

        payment.setProviderPaymentId(request.getRazorpayPaymentId());
        payment.setProviderSignature(request.getRazorpaySignature());
        payment.setUpdatedAt(LocalDateTime.now());

        paymentRepository.save(payment);

        return confirmPayment(
                payment,
                request.getRazorpayPaymentId()
        );
    }



    @Override
    @Transactional
    public PaymentResponse markAsFailed(Integer paymentId) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Payment not found with id: "
                                                + paymentId
                                )
                        );

        if (payment.getPaymentStatus() == PaymentStatus.FAILED) {
            return mapToResponse(payment, null);
        }

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException(
                    "Paid payment cannot be marked as failed"
            );
        }

        CustomerOrder order = payment.getOrder();

        if (order.getOrderStatus() == OrderStatus.CONFIRMED) {
            throw new RuntimeException(
                    "Payment cannot be marked as failed "
                            + "for a confirmed order"
            );
        }

        if (order.getOrderStatus() == OrderStatus.PLACED) {
            inventoryReservationService.releaseByOrderId(order.getId());

            order.setOrderStatus(OrderStatus.CANCELLED);
            order.setUpdatedAt(LocalDateTime.now());

            customerOrderRepository.save(order);

        } else if (order.getOrderStatus() != OrderStatus.CANCELLED) {
            throw new RuntimeException(
                    "Payment cannot be marked as failed "
                            + "for order status: "
                            + order.getOrderStatus()
            );
        }

        payment.setPaymentStatus(PaymentStatus.FAILED);
        payment.setUpdatedAt(LocalDateTime.now());

        Payment updatedPayment = paymentRepository.save(payment);

        return mapToResponse(updatedPayment, null);
    }


    private PaymentResponse confirmPayment(Payment payment, String providerPaymentId) {
        CustomerOrder order = payment.getOrder();

        if (order.getOrderStatus() != OrderStatus.PLACED) {
            throw new RuntimeException(
                    "Only placed orders can be confirmed by payment"
            );
        }

        inventoryReservationService.convertByOrderId(order.getId());

        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setProviderPaymentId(providerPaymentId);
        payment.setUpdatedAt(LocalDateTime.now());

        paymentRepository.save(payment);

        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setUpdatedAt(LocalDateTime.now());

        customerOrderRepository.save(order);

        return mapToResponse(payment, null);
    }

    private PaymentResponse mapToResponse(Payment payment, String providerKeyId) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getPaymentMethod(),
                payment.getPaymentStatus(),
                payment.getProvider(),
                payment.getProviderOrderId(),
                payment.getProviderPaymentId(),
                providerKeyId,
                payment.getAmount(),
                payment.getCurrency(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}