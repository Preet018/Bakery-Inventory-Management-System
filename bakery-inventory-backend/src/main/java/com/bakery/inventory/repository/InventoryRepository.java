package com.bakery.inventory.repository;

import com.bakery.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryRepository extends JpaRepository<Inventory, Integer> {
}