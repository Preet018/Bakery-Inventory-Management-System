package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventory.InventoryRequest;
import com.bakery.inventory.dto.inventory.InventoryResponse;

import java.util.List;

public interface InventoryService {
    InventoryResponse createInventory(InventoryRequest request);

    InventoryResponse getInventoryByProductId(Integer productId);

    List<InventoryResponse> getAllInventory();

    InventoryResponse stockIn(Integer productId, Integer quantity, String reason);

    InventoryResponse stockOut(Integer productId, Integer quantity, String reason);

    InventoryResponse adjustStock(Integer productId, Integer quantity, String reason);

    InventoryResponse updateMinimumStock(Integer productId, Integer minimumStock);

    List<InventoryResponse> getLowStockProducts();

    List<InventoryResponse> getOutOfStockProducts();

    void recordDamage(Integer productId, Integer quantity, String reason);
}