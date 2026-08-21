package com.bakery.inventory.dto.payment;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentGatewayOrder {
    private String providerOrderId;
    private String providerKeyId;
}