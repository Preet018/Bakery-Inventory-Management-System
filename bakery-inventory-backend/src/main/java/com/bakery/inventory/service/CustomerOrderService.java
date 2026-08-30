package com.bakery.inventory.service;

import com.bakery.inventory.dto.customerorder.CustomerOrderCreateRequest;
import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.entity.OrderStatus;

import java.util.List;

public interface CustomerOrderService {
    CustomerOrderResponse createOrder(Integer userId, CustomerOrderCreateRequest request);

    List<CustomerOrderResponse> getAllOrders();

    CustomerOrderResponse getOrderById(Integer id, Integer requestingUserId, String requestingRole);

    List<CustomerOrderResponse> getOrdersByUserId(Integer userId, Integer requestingUserId, String requestingRole);

    CustomerOrderResponse updateOrderStatus(Integer id, OrderStatus status, String requestingRole);

    CustomerOrderResponse updateOrderStatus(Integer id, OrderStatus status);

    CustomerOrderResponse cancelOrder(Integer id, Integer requestingUserId, String requestingRole);
}