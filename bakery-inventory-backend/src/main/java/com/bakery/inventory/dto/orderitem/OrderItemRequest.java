package com.bakery.inventory.dto.orderitem;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {

    private Integer productId;
    private Integer quantity;
}