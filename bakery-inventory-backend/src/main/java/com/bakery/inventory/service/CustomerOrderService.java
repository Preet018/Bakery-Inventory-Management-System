package com.bakery.inventory.service;

import com.bakery.inventory.dto.customerorder.CustomerOrderRequest;
import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.entity.OrderStatus;

import java.util.List;

public interface CustomerOrderService {

    CustomerOrderResponse createOrder(CustomerOrderRequest request);

    List<CustomerOrderResponse> getAllOrders();

    CustomerOrderResponse getOrderById(Integer id);

    List<CustomerOrderResponse> getOrdersByUserId(Integer userId);

    CustomerOrderResponse updateOrderStatus(
            Integer id,
            OrderStatus status
    );

    CustomerOrderResponse cancelOrder(Integer id);
}