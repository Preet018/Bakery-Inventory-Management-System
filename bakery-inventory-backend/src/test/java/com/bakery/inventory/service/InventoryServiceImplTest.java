package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventory.InventoryResponse;
import com.bakery.inventory.dto.inventory.StockAdjustmentRequest;
import com.bakery.inventory.dto.inventory.StockDamageRequest;
import com.bakery.inventory.dto.inventory.StockPurchaseRequest;
import com.bakery.inventory.entity.Inventory;
import com.bakery.inventory.entity.Product;
import com.bakery.inventory.entity.StockTransaction;
import com.bakery.inventory.entity.StockTransactionType;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.InsufficientStockException;
import com.bakery.inventory.repository.InventoryRepository;
import com.bakery.inventory.repository.StockTransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private StockTransactionRepository stockTransactionRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private Inventory createInventory(
            int productId,
            int quantity,
            int reservedQuantity
    ) {
        Product product = new Product();
        product.setId(productId);

        Inventory inventory = new Inventory();
        inventory.setId(1);
        inventory.setProduct(product);
        inventory.setQuantity(quantity);
        inventory.setReservedQuantity(reservedQuantity);
        inventory.setMinimumStock(10);

        return inventory;
    }

    @Test
    void purchaseStock_shouldIncreaseQuantity() {
        Inventory inventory =
                createInventory(1, 50, 10);

        StockPurchaseRequest request =
                new StockPurchaseRequest(
                        20,
                        "Weekly purchase"
                );

        when(inventoryRepository.findByProductIdForUpdate(1))
                .thenReturn(java.util.Optional.of(inventory));

        when(inventoryRepository.save(inventory))
                .thenReturn(inventory);

        InventoryResponse response =
                inventoryService.purchaseStock(1, request);

        assertEquals(70, inventory.getQuantity());
        assertEquals(60, response.getAvailableQuantity());

        ArgumentCaptor<StockTransaction> captor =
                ArgumentCaptor.forClass(StockTransaction.class);

        verify(stockTransactionRepository)
                .save(captor.capture());

        assertEquals(
                StockTransactionType.PURCHASE,
                captor.getValue().getType()
        );

        assertEquals(
                20,
                captor.getValue().getQuantity()
        );
    }

    @Test
    void recordDamage_shouldThrowException_whenStockBecomesNegative() {
        Inventory inventory =
                createInventory(1, 5, 0);

        StockDamageRequest request =
                new StockDamageRequest(
                        10,
                        "Damaged stock"
                );

        when(inventoryRepository.findByProductIdForUpdate(1))
                .thenReturn(java.util.Optional.of(inventory));

        InsufficientStockException exception =
                assertThrows(
                        InsufficientStockException.class,
                        () -> inventoryService.recordDamage(1, request)
                );

        assertEquals(
                "Insufficient stock for product id: 1",
                exception.getMessage()
        );

        verify(inventoryRepository, never())
                .save(any(Inventory.class));

        verifyNoInteractions(stockTransactionRepository);
    }

    @Test
    void adjustStock_shouldRejectQuantityBelowReservedStock() {
        Inventory inventory =
                createInventory(1, 50, 30);

        StockAdjustmentRequest request =
                new StockAdjustmentRequest(
                        20,
                        "Stock count correction"
                );

        when(inventoryRepository.findByProductIdForUpdate(1))
                .thenReturn(java.util.Optional.of(inventory));

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () -> inventoryService.adjustStock(1, request)
                );

        assertEquals(
                "Adjusted stock cannot be less than reserved stock for product id: 1",
                exception.getMessage()
        );

        verify(inventoryRepository, never())
                .save(any(Inventory.class));

        verifyNoInteractions(stockTransactionRepository);
    }
}