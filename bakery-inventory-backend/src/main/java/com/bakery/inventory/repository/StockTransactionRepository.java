package com.bakery.inventory.repository;

import com.bakery.inventory.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Integer> {
}