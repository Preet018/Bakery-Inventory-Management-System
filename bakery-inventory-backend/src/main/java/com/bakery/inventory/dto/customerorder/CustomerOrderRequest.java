package com.bakery.inventory.dto.customerorder;

import com.bakery.inventory.dto.orderitem.OrderItemRequest;
import com.bakery.inventory.entity.PaymentMethod;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderRequest {

    private Integer userId;
    private String contact;
    private String deliveryAddress;
    private PaymentMethod paymentMethod;
    private List<OrderItemRequest> items;
}