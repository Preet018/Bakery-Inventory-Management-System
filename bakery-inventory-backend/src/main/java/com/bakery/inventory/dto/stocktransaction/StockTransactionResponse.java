package com.bakery.inventory.dto.stocktransaction;

import com.bakery.inventory.entity.StockTransactionType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockTransactionResponse {
    private Integer id;
    private Integer inventoryId;
    private Integer orderId;
    private StockTransactionType type;
    private Integer quantity;
    private String reason;
    private LocalDateTime createdAt;
}