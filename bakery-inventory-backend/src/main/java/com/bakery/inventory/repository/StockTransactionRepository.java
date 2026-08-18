package com.bakery.inventory.repository;

import com.bakery.inventory.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Integer> {
    List<StockTransaction> findByInventoryProductId(Integer productId);

    List<StockTransaction> findByInventoryProductCategoryId(Integer categoryId);

    List<StockTransaction> findByOrderId(Integer orderId);
}