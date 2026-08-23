package com.bakery.inventory.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerificationRequest {
    @NotBlank(message = "Razorpay payment ID is required")
    @Size(max = 255, message = "Razorpay payment ID must not exceed 255 characters")
    private String razorpayPaymentId;

    @NotBlank(message = "Razorpay order ID is required")
    @Size(max = 255, message = "Razorpay order ID must not exceed 255 characters")
    private String razorpayOrderId;

    @NotBlank(message = "Razorpay signature is required")
    @Size(max = 255, message = "Razorpay signature must not exceed 255 characters")
    private String razorpaySignature;
}