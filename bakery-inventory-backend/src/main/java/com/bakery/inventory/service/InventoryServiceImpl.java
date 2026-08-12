package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventory.InventoryRequest;
import com.bakery.inventory.dto.inventory.InventoryResponse;
import com.bakery.inventory.entity.Inventory;
import com.bakery.inventory.entity.Product;
import com.bakery.inventory.entity.StockTransaction;
import com.bakery.inventory.entity.StockTransactionType;
import com.bakery.inventory.repository.InventoryRepository;
import com.bakery.inventory.repository.ProductRepository;
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
    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;

    @Override
    public InventoryResponse createInventory(InventoryRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: "
                                        + request.getProductId()
                        )
                );

        Inventory inventory = new Inventory();

        inventory.setProduct(product);
        inventory.setQuantity(request.getQuantity());
        inventory.setMinimumStock(request.getMinimumStock());

        Inventory savedInventory = inventoryRepository.save(inventory);

        return mapToResponse(savedInventory);
    }

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
    public InventoryResponse stockIn(Integer productId, Integer quantity, String reason) {
        validatePositiveQuantity(quantity);

        return updateInventory(
                productId,
                quantity,
                StockTransactionType.PURCHASE,
                reason
        );
    }

    @Override
    @Transactional
    public InventoryResponse adjustStock(Integer productId, Integer quantity, String reason) {
        if (quantity == null || quantity < 0) {
            throw new RuntimeException(
                    "Adjusted stock quantity cannot be negative"
            );
        }

        Inventory inventory = getInventory(productId);

        int adjustment = quantity - inventory.getQuantity();

        return updateInventory(
                productId,
                adjustment,
                StockTransactionType.ADJUSTMENT,
                reason
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

        Inventory updatedInventory =
                inventoryRepository.save(inventory);

        return mapToResponse(updatedInventory);
    }

    @Override
    public List<InventoryResponse> getLowStockProducts() {
        return inventoryRepository.findAll()
                .stream()
                .filter(inventory ->
                        inventory.getQuantity()
                                <= inventory.getMinimumStock()
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
    public void recordDamage(Integer productId, Integer quantity, String reason) {
        validatePositiveQuantity(quantity);

        updateInventory(
                productId,
                -quantity,
                StockTransactionType.DAMAGE,
                reason
        );
    }

    @Override
    @Transactional
    public void returnToSupplier(Integer productId, Integer quantity, String reason) {
        validatePositiveQuantity(quantity);

        updateInventory(
                productId,
                -quantity,
                StockTransactionType.RETURN,
                reason
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

        inventory.setQuantity(newQuantity);

        Inventory updatedInventory =
                inventoryRepository.save(inventory);

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

    private InventoryResponse mapToResponse(Inventory inventory) {

        return new InventoryResponse(
                inventory.getId(),
                inventory.getProduct().getId(),
                inventory.getQuantity(),
                inventory.getMinimumStock(),
                inventory.getQuantity()
                        <= inventory.getMinimumStock()
        );
    }
}