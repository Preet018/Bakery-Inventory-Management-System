package com.bakery.inventory.dto.inventory;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockPurchaseRequest {

    // CHANGE: Quantity is explicitly the amount of stock being purchased.
    @NotNull(message = "Purchase quantity is required")
    @Positive(message = "Purchase quantity must be greater than zero")
    private Integer quantity;

    // CHANGE: Added validation for optional transaction reason.
    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;
}