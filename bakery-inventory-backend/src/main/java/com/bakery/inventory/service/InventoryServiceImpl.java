package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventory.InventoryResponse;
import com.bakery.inventory.dto.stocktransaction.StockTransactionRequest;
import com.bakery.inventory.entity.Inventory;
import com.bakery.inventory.entity.StockTransaction;
import com.bakery.inventory.entity.StockTransactionType;
import com.bakery.inventory.repository.InventoryRepository;
import com.bakery.inventory.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {
    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository stockTransactionRepository;


    @Override
    public InventoryResponse getInventoryByProductId(Integer productId) {
        Inventory inventory = getInventory(productId);

        return mapToResponse(inventory);
    }

    @Override
    public List<InventoryResponse> getAllInventory() {
        return inventoryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public InventoryResponse purchaseStock(Integer productId, StockTransactionRequest request) {
        validatePositiveQuantity(request.getQuantity());

        return updateInventory(
                productId,
                request.getQuantity(),
                StockTransactionType.PURCHASE,
                request.getReason()
        );
    }

    @Override
    @Transactional
    public InventoryResponse returnStock(Integer productId, StockTransactionRequest request) {
        validatePositiveQuantity(request.getQuantity());

        return updateInventory(
                productId,
                -request.getQuantity(),
                StockTransactionType.SUPPLIER_RETURN,
                request.getReason()
        );
    }

    @Override
    @Transactional
    public InventoryResponse adjustStock(Integer productId, StockTransactionRequest request) {
        Integer targetQuantity = request.getQuantity();

        if (targetQuantity == null || targetQuantity < 0) {
            throw new RuntimeException(
                    "Adjusted stock quantity cannot be negative"
            );
        }

        Inventory inventory = getInventory(productId);

        if (targetQuantity < inventory.getReservedQuantity()) {
            throw new RuntimeException(
                    "Adjusted stock cannot be less than reserved stock for product id: "
                            + productId
            );
        }

        int adjustment = targetQuantity - inventory.getQuantity();

        return updateInventory(
                productId,
                adjustment,
                StockTransactionType.ADJUSTMENT,
                request.getReason()
        );
    }

    @Override
    public InventoryResponse updateMinimumStock(Integer productId, Integer minimumStock) {
        if (minimumStock == null || minimumStock < 0) {
            throw new RuntimeException(
                    "Minimum stock cannot be negative"
            );
        }

        Inventory inventory = getInventory(productId);

        inventory.setMinimumStock(minimumStock);

        Inventory updatedInventory = inventoryRepository.save(inventory);

        return mapToResponse(updatedInventory);
    }

    @Override
    public List<InventoryResponse> getLowStockProducts() {
        return inventoryRepository.findAll()
                .stream()
                .filter(inventory ->
                        getAvailableQuantity(inventory) <= inventory.getMinimumStock()
                )
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<InventoryResponse> getOutOfStockProducts() {
        return inventoryRepository.findAll()
                .stream()
                .filter(inventory ->
                        inventory.getQuantity() == 0
                )
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public InventoryResponse recordDamage(Integer productId, StockTransactionRequest request) {
        validatePositiveQuantity(request.getQuantity());

        return updateInventory(
                productId,
                -request.getQuantity(),
                StockTransactionType.DAMAGE,
                request.getReason()
        );
    }

    private InventoryResponse updateInventory(Integer productId, Integer quantityChange, StockTransactionType transactionType, String reason) {
        Inventory inventory = getInventory(productId);

        int currentQuantity = inventory.getQuantity();

        int newQuantity = currentQuantity + quantityChange;

        if (newQuantity < 0) {
            throw new RuntimeException(
                    "Insufficient stock for product id: "
                            + productId
            );
        }

        if (newQuantity < inventory.getReservedQuantity()) {
            throw new RuntimeException(
                    "Insufficient unreserved stock for product id: "
                            + productId
            );
        }

        inventory.setQuantity(newQuantity);

        Inventory updatedInventory = inventoryRepository.save(inventory);

        StockTransaction transaction = new StockTransaction();

        transaction.setInventory(inventory);
        transaction.setType(transactionType);
        transaction.setQuantity(quantityChange);
        transaction.setReason(reason);
        transaction.setCreatedAt(LocalDateTime.now());

        stockTransactionRepository.save(transaction);

        return mapToResponse(updatedInventory);
    }

    private Inventory getInventory(Integer productId) {
        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product id: "
                                        + productId
                        )
                );
    }

    private void validatePositiveQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new RuntimeException(
                    "Quantity must be greater than zero"
            );
        }
    }

    private int getAvailableQuantity(Inventory inventory) {
        return inventory.getQuantity() - inventory.getReservedQuantity();
    }

    private InventoryResponse mapToResponse(Inventory inventory) {
        int availableQuantity = getAvailableQuantity(inventory);

        return new InventoryResponse(
                inventory.getId(),
                inventory.getProduct().getId(),
                inventory.getQuantity(),
                inventory.getReservedQuantity(),
                availableQuantity,
                inventory.getMinimumStock(),
                availableQuantity <= inventory.getMinimumStock()
        );
    }
}