package com.bakery.inventory.dto.customerorder;

import com.bakery.inventory.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CustomerOrderStatusUpdateRequest {
    @NotNull(message = "Order status is required")
    private OrderStatus status;
}