package com.bakery.inventory.service;

import com.bakery.inventory.dto.customerorder.CustomerOrderRequest;
import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.dto.orderitem.OrderItemRequest;
import com.bakery.inventory.dto.orderitem.OrderItemResponse;
import com.bakery.inventory.entity.*;
import com.bakery.inventory.repository.CustomerOrderRepository;
import com.bakery.inventory.repository.InventoryRepository;
import com.bakery.inventory.repository.OrderItemRepository;
import com.bakery.inventory.repository.ProductRepository;
import com.bakery.inventory.repository.StockTransactionRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerOrderServiceImpl implements CustomerOrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserAccountRepository userAccountRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository stockTransactionRepository;

    @Override
    @Transactional
    public CustomerOrderResponse createOrder(
            CustomerOrderRequest request
    ) {

        UserAccount user = userAccountRepository.findById(
                        request.getUserId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: "
                                        + request.getUserId()
                        )
                );

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException(
                    "Order must contain at least one item"
            );
        }

        CustomerOrder order = new CustomerOrder();

        order.setUser(user);
        order.setContact(request.getContact());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setPaymentMethod(request.getPaymentMethod());

        // Initial states are controlled by the backend.
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setOrderStatus(OrderStatus.PLACED);

        LocalDateTime now = LocalDateTime.now();

        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        order.setTotalAmount(BigDecimal.ZERO);

        CustomerOrder savedOrder =
                customerOrderRepository.save(order);

        BigDecimal totalAmount = BigDecimal.ZERO;

        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemRequest : request.getItems()) {

            Product product = productRepository.findById(
                            itemRequest.getProductId()
                    )
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Product not found with id: "
                                            + itemRequest.getProductId()
                            )
                    );

            if (!Boolean.TRUE.equals(product.getIsActive())) {
                throw new RuntimeException(
                        "Product is inactive with id: "
                                + product.getId()
                );
            }

            if (itemRequest.getQuantity() == null
                    || itemRequest.getQuantity() <= 0) {

                throw new RuntimeException(
                        "Quantity must be greater than zero"
                );
            }

            Inventory inventory =
                    inventoryRepository.findByProductId(
                                    product.getId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Inventory not found for product id: "
                                                    + product.getId()
                                    )
                            );

            if (inventory.getQuantity()
                    < itemRequest.getQuantity()) {

                throw new RuntimeException(
                        "Insufficient stock for product id: "
                                + product.getId()
                );
            }

            BigDecimal unitPrice = product.getPrice();

            BigDecimal subtotal =
                    unitPrice.multiply(
                            BigDecimal.valueOf(
                                    itemRequest.getQuantity()
                            )
                    );

            OrderItem orderItem = new OrderItem();

            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubtotal(subtotal);

            orderItems.add(orderItem);

            totalAmount = totalAmount.add(subtotal);

            // Deduct inventory.
            inventory.setQuantity(
                    inventory.getQuantity()
                            - itemRequest.getQuantity()
            );

            inventoryRepository.save(inventory);

            // Create stock audit record.
            StockTransaction transaction =
                    new StockTransaction();

            transaction.setInventory(inventory);
            transaction.setType(StockTransactionType.SALE);

            // Stock leaving inventory = negative.
            transaction.setQuantity(
                    -itemRequest.getQuantity()
            );

            transaction.setReason(
                    "Stock sold through customer order"
            );

            transaction.setReferenceId(savedOrder.getId());
            transaction.setCreatedAt(now);

            stockTransactionRepository.save(transaction);
        }

        orderItemRepository.saveAll(orderItems);

        savedOrder.setTotalAmount(totalAmount);
        savedOrder.setUpdatedAt(LocalDateTime.now());

        CustomerOrder updatedOrder =
                customerOrderRepository.save(savedOrder);

        return mapToResponse(updatedOrder);
    }

    @Override
    public List<CustomerOrderResponse> getAllOrders() {

        return customerOrderRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CustomerOrderResponse getOrderById(Integer id) {

        CustomerOrder order =
                customerOrderRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found with id: "
                                                + id
                                )
                        );

        return mapToResponse(order);
    }

    @Override
    public List<CustomerOrderResponse> getOrdersByUserId(
            Integer userId
    ) {

        userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: "
                                        + userId
                        )
                );

        return customerOrderRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CustomerOrderResponse updateOrderStatus(
            Integer id,
            OrderStatus newStatus
    ) {

        CustomerOrder order =
                customerOrderRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found with id: "
                                                + id
                                )
                        );

        OrderStatus currentStatus =
                order.getOrderStatus();

        if (!isValidStatusTransition(
                currentStatus,
                newStatus
        )) {

            throw new RuntimeException(
                    "Invalid order status transition: "
                            + currentStatus
                            + " -> "
                            + newStatus
            );
        }

        order.setOrderStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());

        CustomerOrder updatedOrder =
                customerOrderRepository.save(order);

        return mapToResponse(updatedOrder);
    }

    @Override
    @Transactional
    public CustomerOrderResponse cancelOrder(Integer id) {

        CustomerOrder order =
                customerOrderRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found with id: "
                                                + id
                                )
                        );

        if (order.getOrderStatus() != OrderStatus.PLACED) {

            throw new RuntimeException(
                    "Only placed orders can be cancelled"
            );
        }

        List<OrderItem> orderItems =
                orderItemRepository.findByOrderId(id);

        for (OrderItem orderItem : orderItems) {

            Product product = orderItem.getProduct();

            Inventory inventory =
                    inventoryRepository.findByProductId(
                                    product.getId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Inventory not found for product id: "
                                                    + product.getId()
                                    )
                            );

            int quantity = orderItem.getQuantity();

            // Return stock to inventory.
            inventory.setQuantity(
                    inventory.getQuantity() + quantity
            );

            inventoryRepository.save(inventory);

            // Create RETURN transaction.
            StockTransaction transaction =
                    new StockTransaction();

            transaction.setInventory(inventory);
            transaction.setType(
                    StockTransactionType.RETURN
            );

            transaction.setQuantity(quantity);

            transaction.setReason(
                    "Stock returned due to order cancellation"
            );

            transaction.setReferenceId(order.getId());
            transaction.setCreatedAt(LocalDateTime.now());

            stockTransactionRepository.save(transaction);
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());

        CustomerOrder cancelledOrder =
                customerOrderRepository.save(order);

        return mapToResponse(cancelledOrder);
    }

    private boolean isValidStatusTransition(
            OrderStatus currentStatus,
            OrderStatus newStatus
    ) {

        if (currentStatus == OrderStatus.PLACED) {

            return newStatus == OrderStatus.CONFIRMED
                    || newStatus == OrderStatus.CANCELLED;
        }

        if (currentStatus == OrderStatus.CONFIRMED) {

            return newStatus == OrderStatus.PROCESSING;
        }

        if (currentStatus == OrderStatus.PROCESSING) {

            return newStatus == OrderStatus.READY;
        }

        if (currentStatus == OrderStatus.READY) {

            return newStatus == OrderStatus.DELIVERED;
        }

        return false;
    }

    private CustomerOrderResponse mapToResponse(
            CustomerOrder order
    ) {

        List<OrderItemResponse> itemResponses =
                orderItemRepository.findByOrderId(
                                order.getId()
                        )
                        .stream()
                        .map(this::mapOrderItemToResponse)
                        .toList();

        return new CustomerOrderResponse(
                order.getId(),
                order.getUser().getId(),
                order.getContact(),
                order.getDeliveryAddress(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getOrderStatus(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                itemResponses
        );
    }

    private OrderItemResponse mapOrderItemToResponse(
            OrderItem orderItem
    ) {

        return new OrderItemResponse(
                orderItem.getId(),
                orderItem.getProduct().getId(),
                orderItem.getQuantity(),
                orderItem.getUnitPrice(),
                orderItem.getSubtotal()
        );
    }
}