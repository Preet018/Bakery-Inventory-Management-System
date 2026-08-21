package com.bakery.inventory.dto.orderitem;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private Integer id;
    private Integer productId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}