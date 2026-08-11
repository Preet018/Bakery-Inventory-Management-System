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

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product id: "
                                        + productId
                        )
                );

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
    public InventoryResponse stockIn(
            Integer productId,
            Integer quantity,
            String reason
    ) {

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product id: "
                                        + productId
                        )
                );

        inventory.setQuantity(
                inventory.getQuantity() + quantity
        );

        Inventory updatedInventory =
                inventoryRepository.save(inventory);

        StockTransaction transaction = new StockTransaction();

        transaction.setInventory(inventory);
        transaction.setType(StockTransactionType.PURCHASE);
        transaction.setQuantity(quantity);
        transaction.setReason(reason);
        transaction.setCreatedAt(LocalDateTime.now());

        stockTransactionRepository.save(transaction);

        return mapToResponse(updatedInventory);
    }

    @Override
    @Transactional
    public InventoryResponse stockOut(
            Integer productId,
            Integer quantity,
            String reason
    ) {

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product id: "
                                        + productId
                        )
                );

        if (quantity > inventory.getQuantity()) {
            throw new RuntimeException(
                    "Insufficient stock for product id: " + productId
            );
        }

        inventory.setQuantity(
                inventory.getQuantity() - quantity
        );

        Inventory updatedInventory =
                inventoryRepository.save(inventory);

        StockTransaction transaction = new StockTransaction();

        transaction.setInventory(inventory);
        transaction.setType(StockTransactionType.SALE);
        transaction.setQuantity(-quantity);
        transaction.setReason(reason);
        transaction.setCreatedAt(LocalDateTime.now());

        stockTransactionRepository.save(transaction);

        return mapToResponse(updatedInventory);
    }

    @Override
    @Transactional
    public InventoryResponse adjustStock(
            Integer productId,
            Integer quantity,
            String reason
    ) {

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product id: "
                                        + productId
                        )
                );

        int oldQuantity = inventory.getQuantity();

        int adjustment = quantity - oldQuantity;

        inventory.setQuantity(quantity);

        Inventory updatedInventory =
                inventoryRepository.save(inventory);

        StockTransaction transaction = new StockTransaction();

        transaction.setInventory(inventory);
        transaction.setType(StockTransactionType.ADJUSTMENT);
        transaction.setQuantity(adjustment);
        transaction.setReason(reason);
        transaction.setCreatedAt(LocalDateTime.now());

        stockTransactionRepository.save(transaction);

        return mapToResponse(updatedInventory);
    }

    @Override
    public InventoryResponse updateMinimumStock(
            Integer productId,
            Integer minimumStock
    ) {

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for product id: "
                                        + productId
                        )
                );

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

    private InventoryResponse mapToResponse(
            Inventory inventory
    ) {

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