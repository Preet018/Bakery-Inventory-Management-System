package com.bakery.inventory.controller;

import com.bakery.inventory.dto.inventory.InventoryResponse;
import com.bakery.inventory.dto.stocktransaction.StockTransactionRequest;
import com.bakery.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAllInventory() {
        return ResponseEntity.ok(
                inventoryService.getAllInventory()
        );
    }

    @GetMapping("/{productId}")
    public ResponseEntity<InventoryResponse> getInventoryByProductId(@PathVariable Integer productId) {
        return ResponseEntity.ok(
                inventoryService.getInventoryByProductId(productId)
        );
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryResponse>> getLowStockProducts() {
        return ResponseEntity.ok(
                inventoryService.getLowStockProducts()
        );
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<InventoryResponse>> getOutOfStockProducts() {
        return ResponseEntity.ok(
                inventoryService.getOutOfStockProducts()
        );
    }

    @PostMapping("/{productId}/purchase")
    public ResponseEntity<InventoryResponse> purchaseStock(@PathVariable Integer productId, @RequestBody StockTransactionRequest request) {
        return ResponseEntity.ok(
                inventoryService.purchaseStock(
                        productId,
                        request
                )
        );
    }

    @PostMapping("/{productId}/return")
    public ResponseEntity<InventoryResponse> returnStock(@PathVariable Integer productId, @RequestBody StockTransactionRequest request) {
        return ResponseEntity.ok(
                inventoryService.returnStock(
                        productId,
                        request
                )
        );
    }

    @PostMapping("/{productId}/adjust")
    public ResponseEntity<InventoryResponse> adjustStock(@PathVariable Integer productId, @RequestBody StockTransactionRequest request) {
        return ResponseEntity.ok(
                inventoryService.adjustStock(
                        productId,
                        request
                )
        );
    }

    @PostMapping("/{productId}/damage")
    public ResponseEntity<InventoryResponse> recordDamage(@PathVariable Integer productId, @RequestBody StockTransactionRequest request) {
        return ResponseEntity.ok(
                inventoryService.recordDamage(
                        productId,
                        request
                )
        );
    }

    @PatchMapping("/{productId}/minimum-stock")
    public ResponseEntity<InventoryResponse> updateMinimumStock(@PathVariable Integer productId, @RequestParam Integer minimumStock) {
        return ResponseEntity.ok(
                inventoryService.updateMinimumStock(
                        productId,
                        minimumStock
                )
        );
    }
}