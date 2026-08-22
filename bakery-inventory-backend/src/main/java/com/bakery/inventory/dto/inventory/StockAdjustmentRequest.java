package com.bakery.inventory.dto.inventory;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    // CHANGE: Explicitly represents the desired final inventory quantity.
    @NotNull(message = "Target quantity is required")
    @PositiveOrZero(message = "Target quantity cannot be negative")
    private Integer targetQuantity;

    // CHANGE: Added validation for optional adjustment reason.
    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;
}