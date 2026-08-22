package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventory.*;

import java.util.List;

public interface InventoryService {
    InventoryResponse getInventoryByProductId(Integer productId);

    List<InventoryResponse> getAllInventory();

    InventoryResponse purchaseStock(Integer productId, StockPurchaseRequest request);

    InventoryResponse returnStock(Integer productId, SupplierReturnRequest request);

    InventoryResponse adjustStock(Integer productId, StockAdjustmentRequest request);

    InventoryResponse updateMinimumStock(Integer productId, MinimumStockUpdateRequest request);

    List<InventoryResponse> getLowStockProducts();

    List<InventoryResponse> getOutOfStockProducts();

    InventoryResponse recordDamage(Integer productId, StockDamageRequest request);
}