package com.bakery.inventory.dto.payment;

import com.bakery.inventory.entity.PaymentMethod;
import com.bakery.inventory.entity.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Integer id;
    private Integer orderId;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String provider;
    private String providerOrderId;
    private String providerPaymentId;
    private String providerKeyId;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}