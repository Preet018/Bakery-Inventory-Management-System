package com.bakery.inventory.controller;

import com.bakery.inventory.dto.inventory.*;
import com.bakery.inventory.service.InventoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Validated
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAllInventory() {
        return ResponseEntity.ok(
                inventoryService.getAllInventory()
        );
    }

    @GetMapping("/{productId}")
    public ResponseEntity<InventoryResponse> getInventoryByProductId(@Positive(message = "Product ID must be positive") @PathVariable Integer productId) {
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
    public ResponseEntity<InventoryResponse> purchaseStock(@Positive(message = "Product ID must be positive") @PathVariable Integer productId, @Valid @RequestBody StockPurchaseRequest request) {
        return ResponseEntity.ok(
                inventoryService.purchaseStock(
                        productId,
                        request
                )
        );
    }

    @PostMapping("/{productId}/return")
    public ResponseEntity<InventoryResponse> returnStock(@Positive(message = "Product ID must be positive") @PathVariable Integer productId, @Valid @RequestBody SupplierReturnRequest request) {
        return ResponseEntity.ok(
                inventoryService.returnStock(
                        productId,
                        request
                )
        );
    }

    @PostMapping("/{productId}/adjust")
    public ResponseEntity<InventoryResponse> adjustStock(@Positive(message = "Product ID must be positive") @PathVariable Integer productId, @Valid @RequestBody StockAdjustmentRequest request) {
        return ResponseEntity.ok(
                inventoryService.adjustStock(
                        productId,
                        request
                )
        );
    }

    @PostMapping("/{productId}/damage")
    public ResponseEntity<InventoryResponse> recordDamage(@Positive(message = "Product ID must be positive") @PathVariable Integer productId, @Valid @RequestBody StockDamageRequest request) {
        return ResponseEntity.ok(
                inventoryService.recordDamage(
                        productId,
                        request
                )
        );
    }

    @PatchMapping("/{productId}/minimum-stock")
    public ResponseEntity<InventoryResponse> updateMinimumStock(@Positive(message = "Product ID must be positive") @PathVariable Integer productId, @Valid @RequestParam MinimumStockUpdateRequest request) {
        return ResponseEntity.ok(
                inventoryService.updateMinimumStock(
                        productId,
                        request
                )
        );
    }
}