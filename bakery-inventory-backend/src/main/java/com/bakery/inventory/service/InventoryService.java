package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventory.InventoryResponse;
import com.bakery.inventory.dto.stocktransaction.StockTransactionRequest;

import java.util.List;

public interface InventoryService {
    InventoryResponse getInventoryByProductId(Integer productId);

    List<InventoryResponse> getAllInventory();

    InventoryResponse purchaseStock(Integer productId, StockTransactionRequest request);

    InventoryResponse returnStock(Integer productId, StockTransactionRequest request);

    InventoryResponse adjustStock(Integer productId, StockTransactionRequest request);

    InventoryResponse updateMinimumStock(Integer productId, Integer minimumStock);

    List<InventoryResponse> getLowStockProducts();

    List<InventoryResponse> getOutOfStockProducts();

    InventoryResponse recordDamage(Integer productId, StockTransactionRequest request);
}