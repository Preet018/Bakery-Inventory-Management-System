package com.bakery.inventory.dto.customerorder;

import com.bakery.inventory.entity.OrderStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CustomerOrderStatusUpdateRequest {
    private OrderStatus status;
}