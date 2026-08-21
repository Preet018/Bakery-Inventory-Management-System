package com.bakery.inventory.dto.inventory;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {

    private Integer id;
    private Integer productId;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private Integer minimumStock;
    private Boolean lowStock;
}