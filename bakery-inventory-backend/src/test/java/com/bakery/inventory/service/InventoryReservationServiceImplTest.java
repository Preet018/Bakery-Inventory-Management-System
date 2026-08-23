package com.bakery.inventory.service;

import com.bakery.inventory.entity.CustomerOrder;
import com.bakery.inventory.entity.Inventory;
import com.bakery.inventory.entity.InventoryReservation;
import com.bakery.inventory.entity.Product;
import com.bakery.inventory.exception.InsufficientStockException;
import com.bakery.inventory.repository.CustomerOrderRepository;
import com.bakery.inventory.repository.InventoryRepository;
import com.bakery.inventory.repository.InventoryReservationRepository;
import com.bakery.inventory.repository.ProductRepository;
import com.bakery.inventory.repository.StockTransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryReservationServiceImplTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryReservationRepository inventoryReservationRepository;

    @Mock
    private CustomerOrderRepository customerOrderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockTransactionRepository stockTransactionRepository;

    @InjectMocks
    private InventoryReservationServiceImpl reservationService;

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
    void reserve_shouldIncreaseReservedQuantity() {
        CustomerOrder order = new CustomerOrder();
        order.setId(100);

        Product product = new Product();
        product.setId(1);

        Inventory inventory =
                createInventory(1, 50, 10);

        InventoryReservation savedReservation =
                new InventoryReservation();

        savedReservation.setId(1);
        savedReservation.setOrder(order);
        savedReservation.setProduct(product);
        savedReservation.setQuantity(5);

        when(customerOrderRepository.findById(100))
                .thenReturn(Optional.of(order));

        when(productRepository.findById(1))
                .thenReturn(Optional.of(product));

        when(inventoryRepository.findByProductIdForUpdate(1))
                .thenReturn(Optional.of(inventory));

        when(inventoryReservationRepository
                .findByOrderIdAndProductId(100, 1))
                .thenReturn(Optional.empty());

        when(inventoryRepository.save(inventory))
                .thenReturn(inventory);

        when(inventoryReservationRepository.save(
                any(InventoryReservation.class)
        )).thenReturn(savedReservation);

        var response =
                reservationService.reserve(
                        100,
                        1,
                        5
                );

        assertEquals(
                15,
                inventory.getReservedQuantity()
        );

        assertEquals(
                5,
                response.getQuantity()
        );

        verify(inventoryRepository)
                .save(inventory);

        verify(inventoryReservationRepository)
                .save(any(InventoryReservation.class));
    }

    @Test
    void reserve_shouldThrowException_whenAvailableStockIsInsufficient() {
        CustomerOrder order = new CustomerOrder();
        order.setId(100);

        Product product = new Product();
        product.setId(1);

        Inventory inventory =
                createInventory(1, 20, 15);

        when(customerOrderRepository.findById(100))
                .thenReturn(Optional.of(order));

        when(productRepository.findById(1))
                .thenReturn(Optional.of(product));

        when(inventoryRepository.findByProductIdForUpdate(1))
                .thenReturn(Optional.of(inventory));

        InsufficientStockException exception =
                assertThrows(
                        InsufficientStockException.class,
                        () -> reservationService.reserve(
                                100,
                                1,
                                10
                        )
                );

        assertEquals(
                "Insufficient available stock for product id: 1",
                exception.getMessage()
        );

        assertEquals(
                15,
                inventory.getReservedQuantity()
        );

        verify(inventoryRepository, never())
                .save(any(Inventory.class));

        verify(inventoryReservationRepository, never())
                .save(any(InventoryReservation.class));
    }
}