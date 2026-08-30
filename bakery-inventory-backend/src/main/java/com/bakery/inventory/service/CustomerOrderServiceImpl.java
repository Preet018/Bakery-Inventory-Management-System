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
import org.springframework.security.access.AccessDeniedException;
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
        public CustomerOrderResponse createOrder(Integer userId, CustomerOrderCreateRequest request) {
                UserAccount user = userAccountRepository.findById(userId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "User not found with id: " + userId
                                        )
                                );

                if (!"CUSTOMER".equals(user.getRole().getName())) {
                    throw new BusinessRuleException(
                            "Only customers can create orders."
                    );
                }

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
                                userId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Saved address not found for user with id: " + userId
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

                order.setOrderStatus(OrderStatus.PENDING_PAYMENT);

                LocalDateTime now = LocalDateTime.now();

                order.setCreatedAt(now);
                order.setUpdatedAt(now);
                order.setTotalAmount(BigDecimal.ZERO);

                CustomerOrder savedOrder = customerOrderRepository.save(order);

                BigDecimal totalAmount = BigDecimal.ZERO;

                List<OrderItem> orderItems = new ArrayList<>();

                // Sort items ascending by productId to enforce deterministic lock ordering and prevent deadlocks
                List<OrderItemRequest> sortedItems = request.getItems().stream()
                        .sorted(java.util.Comparator.comparing(OrderItemRequest::getProductId))
                        .toList();

                for (OrderItemRequest itemRequest : sortedItems) {
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

                return mapToResponse(updatedOrder, paymentResponse);
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
        public CustomerOrderResponse getOrderById(Integer id, Integer requestingUserId, String requestingRole) {
                CustomerOrder order = customerOrderRepository.findById(id)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Order not found with id: " + id
                                        )
                                );

                if (!"ADMIN".equals(requestingRole) && !"INVENTORY_MANAGER".equals(requestingRole) && !order.getUser().getId().equals(requestingUserId)) {
                    throw new AccessDeniedException(
                            "You are not authorized to access this order."
                    );
                }

                return mapToResponse(order);
        }

        @Override
        @Transactional(readOnly = true)
        public List<CustomerOrderResponse> getOrdersByUserId(Integer userId, Integer requestingUserId, String requestingRole) {
                if (!"ADMIN".equals(requestingRole) && !"INVENTORY_MANAGER".equals(requestingRole) && !userId.equals(requestingUserId)) {
                    throw new AccessDeniedException(
                            "You are not authorized to access these orders."
                    );
                }

                userAccountRepository.findById(userId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "User not found with id: " + userId
                                        )
                                );

                return customerOrderRepository.findByUserId(userId)
                                .stream()
                                .filter(order -> {
                                    // CHANGE: Only filter out uncompleted PENDING_PAYMENT sessions for customer; CANCELLED orders remain visible in history
                                    if (!"ADMIN".equals(requestingRole) && !"INVENTORY_MANAGER".equals(requestingRole)) {
                                        return order.getOrderStatus() != OrderStatus.PENDING_PAYMENT;
                                    }
                                    return true;
                                })
                                .map(this::mapToResponse)
                                .toList();
        }

        @Override
        @Transactional
        public CustomerOrderResponse updateOrderStatus(Integer id, OrderStatus newStatus, String requestingRole) {
                if (!"INVENTORY_MANAGER".equals(requestingRole)) {
                    throw new AccessDeniedException(
                            "Only inventory managers can perform order fulfillment status updates."
                    );
                }

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
        public CustomerOrderResponse updateOrderStatus(Integer id, OrderStatus newStatus) {
                return updateOrderStatus(id, newStatus, "INVENTORY_MANAGER");
        }

        @Override
        @Transactional
        public CustomerOrderResponse cancelOrder(Integer id, Integer requestingUserId, String requestingRole) {
                CustomerOrder order = customerOrderRepository.findByIdForUpdate(id)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                 "Order not found with id: " + id
                                         )
                                );

                if (!"ADMIN".equals(requestingRole) && !"INVENTORY_MANAGER".equals(requestingRole) && !order.getUser().getId().equals(requestingUserId)) {
                    throw new AccessDeniedException(
                            "You are not authorized to cancel this order."
                    );
                }

                // CHANGE: Allow cancellation for PENDING_PAYMENT, PLACED, and CONFIRMED orders before fulfillment processing begins
                if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT && order.getOrderStatus() != OrderStatus.PLACED && order.getOrderStatus() != OrderStatus.CONFIRMED) {
                    throw new BusinessRuleException(
                            "Only pending, placed, or confirmed orders can be cancelled before fulfillment processing begins"
                    );
                }

                // 1. If order has a captured/paid Razorpay payment, initiate full Razorpay refund first
                Payment payment = order.getPayment();
                PaymentResponse refundedPayment = null;
                if (payment != null && payment.getPaymentStatus() == PaymentStatus.PAID && payment.getProviderPaymentId() != null) {
                    refundedPayment = paymentService.refundPayment(id);
                }

                // 2. Release reserved inventory
                inventoryReservationService.releaseByOrderId(id);

                // 3. Mark order as CANCELLED and persist
                order.setOrderStatus(OrderStatus.CANCELLED);
                order.setUpdatedAt(LocalDateTime.now());

                CustomerOrder cancelledOrder = customerOrderRepository.save(order);

                // CHANGE: Return mapped response with refunded payment metadata if refund was executed
                if (refundedPayment != null) {
                    return mapToResponse(cancelledOrder, refundedPayment);
                }
                return mapToResponse(cancelledOrder);
        }

        private boolean isValidStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
                if (currentStatus == OrderStatus.PENDING_PAYMENT || currentStatus == OrderStatus.PLACED) {
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

            PaymentResponse paymentResponse = null;

            if (payment != null) {
                paymentResponse = new PaymentResponse(
                        payment.getId(),
                        payment.getOrder().getId(),
                        payment.getPaymentMethod(),
                        payment.getPaymentStatus(),
                        payment.getProvider(),
                        payment.getProviderOrderId(),
                        payment.getProviderPaymentId(),
                        null,
                        payment.getAmount(),
                        payment.getCurrency(),
                        payment.getCreatedAt(),
                        payment.getUpdatedAt()
                );
            }


            return new CustomerOrderResponse(
                        order.getId(),
                        order.getUser().getId(),
                        order.getUser() != null ? order.getUser().getUsername() : null,
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
                        itemResponses,
                        paymentResponse
                );
        }

        private CustomerOrderResponse mapToResponse(CustomerOrder order, PaymentResponse paymentResponse) {
            List<OrderItemResponse> itemResponses =
                    orderItemRepository.findByOrderId(order.getId())
                            .stream()
                            .map(this::mapOrderItemToResponse)
                            .toList();

            return new CustomerOrderResponse(
                    order.getId(),
                    order.getUser().getId(),
                    order.getUser() != null ? order.getUser().getUsername() : null,
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

                    itemResponses,

                    paymentResponse
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