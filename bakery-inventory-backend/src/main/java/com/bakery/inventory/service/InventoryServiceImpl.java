package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventory.*;
import com.bakery.inventory.entity.Inventory;
import com.bakery.inventory.entity.StockTransaction;
import com.bakery.inventory.entity.StockTransactionType;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.InsufficientStockException;
import com.bakery.inventory.exception.ResourceNotFoundException;
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
    public InventoryResponse purchaseStock(Integer productId, StockPurchaseRequest request) {
        return updateInventory(
                productId,
                request.getQuantity(),
                StockTransactionType.PURCHASE,
                request.getReason()
        );
    }

    @Override
    @Transactional
    public InventoryResponse returnStock(Integer productId, SupplierReturnRequest request) {
        return updateInventory(
                productId,
                -request.getQuantity(),
                StockTransactionType.SUPPLIER_RETURN,
                request.getReason()
        );
    }

    @Override
    @Transactional
    public InventoryResponse adjustStock(Integer productId, StockAdjustmentRequest request) {
        Integer targetQuantity = request.getTargetQuantity();

        Inventory inventory = getInventory(productId);

        if (targetQuantity < inventory.getReservedQuantity()) {
            throw new BusinessRuleException(
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
    public InventoryResponse updateMinimumStock(Integer productId, MinimumStockUpdateRequest request) {
        Inventory inventory = getInventory(productId);

        inventory.setMinimumStock(request.getMinimumStock());

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
    public InventoryResponse recordDamage(Integer productId, StockDamageRequest request) {
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
            throw new InsufficientStockException(
                    "Insufficient stock for product id: "
                            + productId
            );
        }

        if (newQuantity < inventory.getReservedQuantity()) {
            throw new InsufficientStockException(
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
                        new ResourceNotFoundException(
                                "Inventory not found for product id: "
                                        + productId
                        )
                );
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