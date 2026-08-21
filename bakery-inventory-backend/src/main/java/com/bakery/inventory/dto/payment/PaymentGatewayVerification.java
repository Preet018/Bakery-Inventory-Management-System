package com.bakery.inventory.dto.payment;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentGatewayVerification {
    private String providerPaymentId;
    private boolean verified;
}