package com.bakery.inventory.dto.inventory;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryRequest {

    private Integer productId;
    private Integer quantity;
    private Integer minimumStock;
}