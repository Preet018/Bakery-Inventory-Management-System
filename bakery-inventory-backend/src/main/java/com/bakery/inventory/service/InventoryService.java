package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventory.InventoryResponse;
import com.bakery.inventory.dto.inventory.StockOperationRequest;

import java.util.List;

public interface InventoryService {
    InventoryResponse getInventoryByProductId(Integer productId);

    List<InventoryResponse> getAllInventory();

    InventoryResponse purchaseStock(Integer productId, StockOperationRequest request);

    InventoryResponse returnStock(Integer productId, StockOperationRequest request);

    InventoryResponse adjustStock(Integer productId, StockOperationRequest request);

    InventoryResponse updateMinimumStock(Integer productId, Integer minimumStock);

    List<InventoryResponse> getLowStockProducts();

    List<InventoryResponse> getOutOfStockProducts();

    InventoryResponse recordDamage(Integer productId, StockOperationRequest request);
}