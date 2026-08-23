package com.bakery.inventory.service;

import com.bakery.inventory.dto.payment.PaymentGatewayOrder;
import com.bakery.inventory.entity.CustomerOrder;
import com.bakery.inventory.entity.OrderStatus;
import com.bakery.inventory.entity.Payment;
import com.bakery.inventory.entity.PaymentMethod;
import com.bakery.inventory.entity.PaymentStatus;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.repository.CustomerOrderRepository;
import com.bakery.inventory.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private InventoryReservationService inventoryReservationService;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CustomerOrderRepository customerOrderRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private CustomerOrder createOrder(
            Integer id,
            OrderStatus status
    ) {
        CustomerOrder order =
                new CustomerOrder();

        order.setId(id);
        order.setOrderStatus(status);
        order.setTotalAmount(
                new BigDecimal("500.00")
        );

        return order;
    }

    @Test
    void createPayment_shouldCreatePendingPayment() {
        CustomerOrder order =
                createOrder(
                        100,
                        OrderStatus.PLACED
                );

        PaymentGatewayOrder gatewayOrder =
                new PaymentGatewayOrder(
                        "order_razorpay_123",
                        "rzp_test_key"
                );

        when(customerOrderRepository.findById(100))
                .thenReturn(Optional.of(order));

        when(paymentGateway.createOrder(
                100,
                new BigDecimal("500.00"),
                "INR"
        )).thenReturn(gatewayOrder);

        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        var response =
                paymentService.createPayment(
                        100,
                        PaymentMethod.UPI,
                        new BigDecimal("500.00")
                );

        assertEquals(
                PaymentStatus.PENDING,
                response.getPaymentStatus()
        );

        assertEquals(
                "RAZORPAY",
                response.getProvider()
        );

        assertEquals(
                "order_razorpay_123",
                response.getProviderOrderId()
        );

        assertEquals(
                "rzp_test_key",
                response.getProviderKeyId()
        );

        verify(paymentRepository)
                .save(any(Payment.class));
    }

    @Test
    void markAsFailed_shouldCancelPlacedOrderAndReleaseReservation() {
        CustomerOrder order =
                createOrder(
                        100,
                        OrderStatus.PLACED
                );

        Payment payment =
                new Payment();

        payment.setId(1);
        payment.setOrder(order);
        payment.setPaymentStatus(
                PaymentStatus.PENDING
        );

        when(paymentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(payment));

        when(paymentRepository.save(payment))
                .thenReturn(payment);

        paymentService.markAsFailed(1);

        assertEquals(
                OrderStatus.CANCELLED,
                order.getOrderStatus()
        );

        assertEquals(
                PaymentStatus.FAILED,
                payment.getPaymentStatus()
        );

        verify(inventoryReservationService)
                .releaseByOrderId(100);

        verify(customerOrderRepository)
                .save(order);

        verify(paymentRepository)
                .save(payment);
    }

    @Test
    void markAsFailed_shouldRejectPaidPayment() {
        CustomerOrder order =
                createOrder(
                        100,
                        OrderStatus.CONFIRMED
                );

        Payment payment =
                new Payment();

        payment.setId(1);
        payment.setOrder(order);
        payment.setPaymentStatus(
                PaymentStatus.PAID
        );

        when(paymentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(payment));

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () -> paymentService.markAsFailed(1)
                );

        assertEquals(
                "Paid payment cannot be marked as failed",
                exception.getMessage()
        );

        verify(paymentRepository, never())
                .save(any(Payment.class));
    }
}