package com.bakery.inventory.dto.inventory;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockOperationRequest {
    private Integer quantity;
    private String reason;
}