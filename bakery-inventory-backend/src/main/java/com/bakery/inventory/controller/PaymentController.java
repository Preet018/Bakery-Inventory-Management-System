package com.bakery.inventory.controller;

import com.bakery.inventory.dto.payment.PaymentResponse;
import com.bakery.inventory.dto.payment.PaymentVerificationRequest;
import com.bakery.inventory.service.PaymentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Validated
public class PaymentController {
    private final PaymentService paymentService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@Positive(message = "Order ID must be positive") @PathVariable Integer orderId) {
        return ResponseEntity.ok(
                paymentService.getPaymentByOrderId(orderId)
        );
    }

    @PostMapping("/{paymentId}/verify")
    public ResponseEntity<PaymentResponse> verifyAndConfirmPayment(@Positive(message = "Payment ID must be positive") @PathVariable Integer paymentId, @Valid @RequestBody PaymentVerificationRequest request) {
        return ResponseEntity.ok(
                paymentService.verifyAndConfirmPayment(
                        paymentId,
                        request
                )
        );
    }

    @PostMapping("/{paymentId}/fail")
    public ResponseEntity<PaymentResponse> markAsFailed(@Positive(message = "Payment ID must be positive") @PathVariable Integer paymentId) {
        return ResponseEntity.ok(
                paymentService.markAsFailed(paymentId)
        );
    }
}