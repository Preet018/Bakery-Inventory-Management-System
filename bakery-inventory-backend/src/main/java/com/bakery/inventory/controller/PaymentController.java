package com.bakery.inventory.controller;

import com.bakery.inventory.dto.payment.PaymentResponse;
import com.bakery.inventory.dto.payment.PaymentVerificationRequest;
import com.bakery.inventory.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@PathVariable Integer orderId) {
        return ResponseEntity.ok(
                paymentService.getPaymentByOrderId(orderId)
        );
    }

    @PostMapping("/{paymentId}/verify")
    public ResponseEntity<PaymentResponse> verifyAndConfirmPayment(@PathVariable Integer paymentId, @RequestBody PaymentVerificationRequest request) {
        return ResponseEntity.ok(
                paymentService.verifyAndConfirmPayment(
                        paymentId,
                        request
                )
        );
    }

    @PostMapping("/{paymentId}/fail")
    public ResponseEntity<PaymentResponse> markAsFailed(@PathVariable Integer paymentId) {
        return ResponseEntity.ok(
                paymentService.markAsFailed(paymentId)
        );
    }
}