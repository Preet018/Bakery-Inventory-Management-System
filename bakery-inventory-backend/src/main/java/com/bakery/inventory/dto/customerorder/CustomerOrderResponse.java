package com.bakery.inventory.dto.customerorder;

import com.bakery.inventory.dto.orderitem.OrderItemResponse;
import com.bakery.inventory.entity.OrderStatus;
import com.bakery.inventory.entity.PaymentMethod;
import com.bakery.inventory.entity.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderResponse {
    private Integer id;
    private Integer userId;
    private String contact;
    private BigDecimal totalAmount;
    private Integer savedAddressId;

    private String deliveryAddress;
    private String deliveryLandmark;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryPostalCode;

    private BigDecimal deliveryLatitude;
    private BigDecimal deliveryLongitude;

    private String deliveryPlaceId;

    private OrderStatus orderStatus;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<OrderItemResponse> items;
}