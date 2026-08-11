package com.bakery.inventory.repository;

import com.bakery.inventory.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Integer> {
}