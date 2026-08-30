package com.bakery.inventory.dto.payment;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentGatewayRefund {
    private String providerRefundId;
    private String status;
    private boolean successful;
}
