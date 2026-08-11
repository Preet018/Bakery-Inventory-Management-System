package com.bakery.inventory.repository;

import com.bakery.inventory.entity.CustomerOrder;
import com.bakery.inventory.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Arrays;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    List<CustomerOrder> findByUserId(Integer userId);

    List<OrderItem> findByOrderId(Integer orderId);
}