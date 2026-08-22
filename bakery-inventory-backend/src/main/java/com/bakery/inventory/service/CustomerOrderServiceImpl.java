package com.bakery.inventory.service;

import com.bakery.inventory.dto.customerorder.CustomerOrderCreateRequest;
import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.dto.orderitem.OrderItemRequest;
import com.bakery.inventory.dto.orderitem.OrderItemResponse;
import com.bakery.inventory.dto.payment.PaymentResponse;
import com.bakery.inventory.entity.*;
import com.bakery.inventory.exception.BadRequestException;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.ResourceNotFoundException;
import com.bakery.inventory.repository.*;
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
        private final SavedAddressRepository savedAddressRepository;

        private final InventoryReservationService inventoryReservationService;
        private final PaymentService paymentService;

        @Override
        @Transactional
        public CustomerOrderResponse createOrder(CustomerOrderCreateRequest request) {
                UserAccount user = userAccountRepository.findById(request.getUserId())
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "User not found with id: " + request.getUserId()
                                        )
                                );

                if (request.getItems() == null || request.getItems().isEmpty()) {
                        throw new BadRequestException(
                                "Order must contain at least one item"
                        );
                }

                CustomerOrder order = new CustomerOrder();

                order.setUser(user);
                order.setContact(request.getContact());

                SavedAddress savedAddress = savedAddressRepository
                        .findByIdAndUserId(
                                request.getSavedAddressId(),
                                request.getUserId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Saved address not found for user with id: " + request.getUserId()
                                )
                        );

                order.setSavedAddress(savedAddress);

                order.setDeliveryAddress(savedAddress.getAddressLine());
                order.setDeliveryLandmark(savedAddress.getLandmark());
                order.setDeliveryCity(savedAddress.getCity());
                order.setDeliveryState(savedAddress.getState());
                order.setDeliveryPostalCode(savedAddress.getPostalCode());

                order.setDeliveryLatitude(savedAddress.getLatitude());
                order.setDeliveryLongitude(savedAddress.getLongitude());
                order.setDeliveryPlaceId(savedAddress.getPlaceId());

                order.setOrderStatus(OrderStatus.PLACED);

                LocalDateTime now = LocalDateTime.now();

                order.setCreatedAt(now);
                order.setUpdatedAt(now);
                order.setTotalAmount(BigDecimal.ZERO);

                CustomerOrder savedOrder = customerOrderRepository.save(order);

                BigDecimal totalAmount = BigDecimal.ZERO;

                List<OrderItem> orderItems = new ArrayList<>();

                for (OrderItemRequest itemRequest : request.getItems()) {
                        Product product = productRepository.findById(
                                        itemRequest.getProductId())
                                        .orElseThrow(() ->
                                                new ResourceNotFoundException(
                                                        "Product not found with id: " + itemRequest.getProductId()
                                                )
                                        );

                        if (!Boolean.TRUE.equals(product.getIsActive())) {
                                throw new BusinessRuleException(
                                        "Product is inactive with id: " + product.getId()
                                );
                        }

                        if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                                throw new BadRequestException(
                                        "Quantity must be greater than zero"
                                );
                        }

                        BigDecimal unitPrice = product.getPrice();

                        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

                        OrderItem orderItem = new OrderItem();

                        orderItem.setOrder(savedOrder);
                        orderItem.setProduct(product);
                        orderItem.setQuantity(itemRequest.getQuantity());
                        orderItem.setUnitPrice(unitPrice);
                        orderItem.setSubtotal(subtotal);

                        orderItems.add(orderItem);

                        totalAmount = totalAmount.add(subtotal);

                        inventoryReservationService.reserve(
                                savedOrder.getId(),
                                product.getId(),
                                itemRequest.getQuantity()
                        );
                }

                orderItemRepository.saveAll(orderItems);

                savedOrder.setTotalAmount(totalAmount);
                savedOrder.setUpdatedAt(LocalDateTime.now());

                CustomerOrder updatedOrder = customerOrderRepository.save(savedOrder);

                PaymentResponse paymentResponse =
                        paymentService.createPayment(
                                updatedOrder.getId(),
                                request.getPaymentMethod(),
                                totalAmount
                        );

                return mapToResponse(updatedOrder);
        }

        @Override
        @Transactional(readOnly = true)
        public List<CustomerOrderResponse> getAllOrders() {
                return customerOrderRepository.findAll()
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        @Override
        @Transactional(readOnly = true)
        public CustomerOrderResponse getOrderById(Integer id) {
                CustomerOrder order = customerOrderRepository.findById(id)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Order not found with id: " + id
                                        )
                                );

                return mapToResponse(order);
        }

        @Override
        @Transactional(readOnly = true)
        public List<CustomerOrderResponse> getOrdersByUserId(Integer userId) {
                userAccountRepository.findById(userId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "User not found with id: " + userId
                                        )
                                );

                return customerOrderRepository.findByUserId(userId)
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        @Override
        @Transactional
        public CustomerOrderResponse updateOrderStatus(Integer id, OrderStatus newStatus) {
                CustomerOrder order = customerOrderRepository.findById(id)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Order not found with id: " + id
                                        )
                                );

                OrderStatus currentStatus = order.getOrderStatus();

                if (!isValidStatusTransition(currentStatus, newStatus)) {
                    throw new BusinessRuleException(
                            "Invalid order status transition: " + currentStatus + " -> " + newStatus
                    );
                }

                order.setOrderStatus(newStatus);
                order.setUpdatedAt(LocalDateTime.now());

                CustomerOrder updatedOrder = customerOrderRepository.save(order);

                return mapToResponse(updatedOrder);
        }

        @Override
        @Transactional
        public CustomerOrderResponse cancelOrder(Integer id) {
                CustomerOrder order = customerOrderRepository.findById(id)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Order not found with id: " + id
                                        )
                                );

                if (order.getOrderStatus() != OrderStatus.PLACED) {
                    throw new BusinessRuleException(
                            "Only placed orders can be cancelled"
                    );
                }

                inventoryReservationService.releaseByOrderId(id);

                order.setOrderStatus(OrderStatus.CANCELLED);
                order.setUpdatedAt(LocalDateTime.now());

                CustomerOrder cancelledOrder = customerOrderRepository.save(order);

                return mapToResponse(cancelledOrder);
        }

        private boolean isValidStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
                if (currentStatus == OrderStatus.PLACED) {
                        return newStatus == OrderStatus.CONFIRMED;
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

        private CustomerOrderResponse mapToResponse(CustomerOrder order) {
                Payment payment = order.getPayment();

                List<OrderItemResponse> itemResponses = orderItemRepository.findByOrderId(order.getId())
                                .stream()
                                .map(this::mapOrderItemToResponse)
                                .toList();

                return new CustomerOrderResponse(
                        order.getId(),
                        order.getUser().getId(),
                        order.getContact(),
                        order.getTotalAmount(),

                        order.getSavedAddress() != null ? order.getSavedAddress().getId() : null,

                        order.getDeliveryAddress(),
                        order.getDeliveryLandmark(),
                        order.getDeliveryCity(),
                        order.getDeliveryState(),
                        order.getDeliveryPostalCode(),
                        order.getDeliveryLatitude(),
                        order.getDeliveryLongitude(),

                        order.getDeliveryPlaceId(),

                        order.getOrderStatus(),
                        order.getCreatedAt(),
                        order.getUpdatedAt(),
                        itemResponses
                );
        }

        private OrderItemResponse mapOrderItemToResponse(OrderItem orderItem) {
                return new OrderItemResponse(
                                orderItem.getId(),
                                orderItem.getProduct().getId(),
                                orderItem.getQuantity(),
                                orderItem.getUnitPrice(),
                                orderItem.getSubtotal()
                );
        }
}