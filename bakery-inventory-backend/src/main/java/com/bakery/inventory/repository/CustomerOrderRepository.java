package com.bakery.inventory.repository;

import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Integer> {
    List<CustomerOrder> findByUserId(Integer userId);
}