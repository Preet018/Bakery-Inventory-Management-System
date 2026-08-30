package com.bakery.inventory.service;

import com.bakery.inventory.dto.payment.*;
import com.bakery.inventory.dto.payment.PaymentVerificationRequest;
import com.bakery.inventory.entity.*;
import com.bakery.inventory.exception.BadRequestException;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.ResourceNotFoundException;
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
                                new ResourceNotFoundException(
                                        "Order not found with id: " + orderId
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

        PaymentGatewayOrder gatewayOrder = paymentGateway.createOrder(orderId, amount, PAYMENT_CURRENCY);

        payment.setProviderOrderId(gatewayOrder.getProviderOrderId());

        Payment savedPayment = paymentRepository.save(payment);

        return mapToResponse(
                savedPayment,
                gatewayOrder.getProviderKeyId()
        );
    }

    @Override
    public PaymentResponse getPaymentByOrderId(Integer orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Payment not found for order id: " + orderId
                                )
                        );

        return mapToResponse(payment, null);
    }

    @Override
    @Transactional
    public PaymentResponse verifyAndConfirmPayment(Integer paymentId, PaymentVerificationRequest request) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Payment not found with id: " + paymentId
                                )
                        );

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            return mapToResponse(payment, null);
        }

        if (payment.getPaymentStatus() == PaymentStatus.FAILED) {
            throw new BusinessRuleException(
                    "Failed payment cannot be confirmed"
            );
        }

        if (!payment.getProviderOrderId().equals(request.getRazorpayOrderId())) {
            throw new BadRequestException(
                    "Razorpay order does not match payment"
            );
        }

        PaymentGatewayVerification verification = paymentGateway
                .verifyPayment(
                        payment.getProviderOrderId(),
                        request.getRazorpayPaymentId(),
                        request.getRazorpaySignature(),
                        payment.getAmount(),
                        payment.getCurrency()
                );

        if (!verification.isVerified()) {
            throw new BadRequestException(
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
                                new ResourceNotFoundException(
                                        "Payment not found with id: " + paymentId
                                )
                        );

        if (payment.getPaymentStatus() == PaymentStatus.FAILED) {
            return mapToResponse(payment, null);
        }

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException(
                    "Paid payment cannot be marked as failed"
            );
        }

        CustomerOrder order = payment.getOrder();

        if (order.getOrderStatus() == OrderStatus.CONFIRMED) {
            throw new BusinessRuleException(
                    "Payment cannot be marked as failed for a confirmed order"
            );
        }

        if (order.getOrderStatus() == OrderStatus.PENDING_PAYMENT || order.getOrderStatus() == OrderStatus.PLACED) {
            inventoryReservationService.releaseByOrderId(order.getId());

            order.setOrderStatus(OrderStatus.CANCELLED);
            order.setUpdatedAt(LocalDateTime.now());

            customerOrderRepository.save(order);

        } else if (order.getOrderStatus() != OrderStatus.CANCELLED) {
            throw new BusinessRuleException(
                    "Payment cannot be marked as failed for order status: " + order.getOrderStatus()
            );
        }

        payment.setPaymentStatus(PaymentStatus.FAILED);
        payment.setUpdatedAt(LocalDateTime.now());

        Payment updatedPayment = paymentRepository.save(payment);

        return mapToResponse(updatedPayment, null);
    }

    @Override
    @Transactional
    public void processWebhookPaymentCaptured(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        paymentRepository.findByProviderOrderId(razorpayOrderId).ifPresent(payment -> {
            if (payment.getPaymentStatus() == PaymentStatus.PAID) {
                return;
            }
            payment.setProviderPaymentId(razorpayPaymentId);
            payment.setProviderSignature(razorpaySignature);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            confirmPayment(payment, razorpayPaymentId);
        });
    }

    @Override
    @Transactional
    public void processWebhookPaymentFailed(String razorpayOrderId, String razorpayPaymentId) {
        paymentRepository.findByProviderOrderId(razorpayOrderId).ifPresent(payment -> {
            if (payment.getPaymentStatus() == PaymentStatus.FAILED || payment.getPaymentStatus() == PaymentStatus.PAID) {
                return;
            }
            markAsFailed(payment.getId());
        });
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(Integer orderId) {
        Payment payment = paymentRepository.findByOrderIdForUpdate(orderId)
                .orElse(null);

        if (payment == null) {
            return null;
        }

        // Idempotency check: If already refunded, return without duplicating
        if (payment.getPaymentStatus() == PaymentStatus.REFUNDED) {
            return mapToResponse(payment, null);
        }

        // Only PAID payments with captured providerPaymentId require Razorpay refund
        if (payment.getPaymentStatus() != PaymentStatus.PAID || payment.getProviderPaymentId() == null) {
            return mapToResponse(payment, null);
        }

        // Initiate Razorpay external refund with deterministic receipt and API idempotency key
        String receipt = "REFUND_ORDER_" + orderId;
        String idempotencyKey = "ORDER_" + orderId + "_PAYMENT_" + payment.getProviderPaymentId() + "_REFUND";
        PaymentGatewayRefund refundResult = paymentGateway.initiateRefund(
                payment.getProviderPaymentId(),
                payment.getAmount(),
                payment.getCurrency() != null ? payment.getCurrency() : PAYMENT_CURRENCY,
                receipt,
                idempotencyKey
        );

        if (!refundResult.isSuccessful()) {
            if ("pending".equalsIgnoreCase(refundResult.getStatus())) {
                throw new BusinessRuleException(
                        "Razorpay refund for order #" + orderId + " is currently pending processing. " +
                        "The order cannot be cancelled until Razorpay confirms the refund is completed."
                );
            }
            throw new BusinessRuleException(
                    "Razorpay refund could not be completed for order #" + orderId + ". Status: " + refundResult.getStatus()
            );
        }

        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        payment.setUpdatedAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);

        return mapToResponse(savedPayment, null);
    }

    private PaymentResponse confirmPayment(Payment payment, String providerPaymentId) {
        CustomerOrder order = payment.getOrder();

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT && order.getOrderStatus() != OrderStatus.PLACED) {
            if (order.getOrderStatus() == OrderStatus.CONFIRMED && payment.getPaymentStatus() == PaymentStatus.PAID) {
                return mapToResponse(payment, providerPaymentId);
            }
            throw new BusinessRuleException(
                    "Only pending or placed orders can be confirmed by payment. Current status: " + order.getOrderStatus()
            );
        }

        try {
            inventoryReservationService.convertByOrderId(order.getId());
        } catch (BusinessRuleException ex) {
            payment.setPaymentStatus(PaymentStatus.REQUIRES_REFUND);
            payment.setProviderPaymentId(providerPaymentId);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            order.setOrderStatus(OrderStatus.CANCELLED);
            order.setUpdatedAt(LocalDateTime.now());
            customerOrderRepository.save(order);

            throw new BusinessRuleException("Payment captured after reservation expired. Flagged for refund: " + ex.getMessage());
        }

        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setProviderPaymentId(providerPaymentId);
        payment.setUpdatedAt(LocalDateTime.now());

        paymentRepository.save(payment);

        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setUpdatedAt(LocalDateTime.now());

        customerOrderRepository.save(order);

        return mapToResponse(payment, providerPaymentId);
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