package com.bakery.inventory.dto.stocktransaction;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockTransactionRequest {
    private Integer quantity;
    private String reason;
}