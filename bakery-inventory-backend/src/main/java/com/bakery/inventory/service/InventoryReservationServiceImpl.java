package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventoryreservation.InventoryReservationResponse;
import com.bakery.inventory.entity.*;
import com.bakery.inventory.exception.*;
import com.bakery.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryReservationServiceImpl implements InventoryReservationService {

    @Value("${bakery.inventory.reservation-ttl-minutes:15}")
    private int reservationDurationMinutes = 15;

    private final InventoryRepository inventoryRepository;
    private final InventoryReservationRepository inventoryReservationRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional
    public InventoryReservationResponse reserve(Integer orderId, Integer productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BadRequestException(
                    "Reservation quantity must be greater than zero"
            );
        }

        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Order not found with id: " + orderId
                        )
                );

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + productId
                        )
                );

        Inventory inventory = inventoryRepository.findByProductIdForUpdate(productId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Inventory not found for product id: " + productId
                                		)
                        );

        int availableQuantity = inventory.getQuantity() - inventory.getReservedQuantity();

        if (quantity > availableQuantity) {
            throw new InsufficientStockException(
                    "Insufficient available stock for product id: "
                            + productId
            );
        }

        inventoryReservationRepository.findByOrderIdAndProductId(orderId, productId)
                .ifPresent(existingReservation -> {
                    throw new BusinessRuleException(
                            "Reservation already exists for order id: "
                                    + orderId
                                    + " and product id: "
                                    + productId
                    );
                });

        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);

        inventoryRepository.save(inventory);

        LocalDateTime reservedAt = LocalDateTime.now();
        LocalDateTime expiresAt = reservedAt.plusMinutes(reservationDurationMinutes);

        InventoryReservation reservation = new InventoryReservation();

        reservation.setOrder(order);
        reservation.setProduct(product);
        reservation.setQuantity(quantity);
        reservation.setReservedAt(reservedAt);
        reservation.setExpiresAt(expiresAt);
        reservation.setStatus(ReservationStatus.ACTIVE);

        InventoryReservation savedReservation = inventoryReservationRepository.save(reservation);

        return mapToResponse(savedReservation);
    }

    @Override
    @Transactional
    public InventoryReservationResponse release(Integer reservationId) {
        InventoryReservation reservation = getReservation(reservationId);

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            return mapToResponse(reservation);
        }

        Integer productId = reservation.getProduct().getId();

        Inventory inventory = inventoryRepository.findByProductIdForUpdate(productId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Inventory not found for product id: "
                                                + productId
                                )
                        );

        int newReservedQuantity = inventory.getReservedQuantity() - reservation.getQuantity();

        if (newReservedQuantity < 0) {
            newReservedQuantity = 0;
        }

        inventory.setReservedQuantity(newReservedQuantity);
        inventoryRepository.save(inventory);
        reservation.setStatus(ReservationStatus.RELEASED);

        InventoryReservation updatedReservation = inventoryReservationRepository.save(reservation);

        return mapToResponse(updatedReservation);
    }

    @Override
    @Transactional
    public List<InventoryReservationResponse> releaseByOrderId(Integer orderId) {
        List<InventoryReservation> reservations = inventoryReservationRepository
                        .findByOrderIdAndStatus(
                                orderId,
                                ReservationStatus.ACTIVE
                        );

        return reservations.stream()
                .map(reservation ->
                        release(reservation.getId())
                )
                .toList();
    }

    @Override
    @Transactional
    public InventoryReservationResponse convert(Integer reservationId) {
        InventoryReservation reservation = getReservation(reservationId);

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new BusinessRuleException(
                    "Only active reservations can be converted. Current status: " + reservation.getStatus()
            );
        }

        if (reservation.getExpiresAt().isBefore(LocalDateTime.now())) {
            // Expire the reservation and throw exception
            expireReservation(reservation);
            throw new BusinessRuleException(
                    "Reservation has expired and cannot be converted to a sale"
            );
        }

        Integer productId = reservation.getProduct().getId();

        Inventory inventory = inventoryRepository.findByProductIdForUpdate(productId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Inventory not found for product id: "
                                                + productId
                                )
                        );

        int reservedQuantity = reservation.getQuantity();

        if (inventory.getReservedQuantity() < reservedQuantity) {
            throw new InsufficientStockException(
                    "Reserved inventory is insufficient for reservation id: "
                            + reservationId
            );
        }

        if (inventory.getQuantity() < reservedQuantity) {
            throw new InsufficientStockException(
                    "Physical inventory is insufficient for reservation id: "
                            + reservationId
            );
        }

        inventory.setQuantity(inventory.getQuantity() - reservedQuantity);

        inventory.setReservedQuantity(inventory.getReservedQuantity() - reservedQuantity);

        inventoryRepository.save(inventory);

        reservation.setStatus(ReservationStatus.CONVERTED);

        InventoryReservation updatedReservation = inventoryReservationRepository.save(reservation);

        StockTransaction saleTransaction = new StockTransaction();

        saleTransaction.setInventory(inventory);

        saleTransaction.setType(StockTransactionType.SALE);
        saleTransaction.setQuantity(-reservedQuantity);
        saleTransaction.setReason("Customer order payment confirmed");
        saleTransaction.setOrder(reservation.getOrder());
        saleTransaction.setCreatedAt(LocalDateTime.now());

        stockTransactionRepository.save(saleTransaction);

        return mapToResponse(updatedReservation);
    }

    @Override
    @Transactional
    public List<InventoryReservationResponse> convertByOrderId(Integer orderId) {
        List<InventoryReservation> reservations = inventoryReservationRepository
                        .findByOrderIdAndStatusOrderByProductIdAsc(
                                orderId,
                                ReservationStatus.ACTIVE
                        );

        if (reservations.isEmpty()) {
            throw new BusinessRuleException(
                    "No active reservations found for order id: "
                            + orderId
            );
        }

        return reservations.stream()
                .map(reservation ->
                        convert(reservation.getId())
                )
                .toList();
    }

    @Override
    @Transactional
    public int releaseExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();

        List<InventoryReservation> expiredReservations = inventoryReservationRepository
                        .findByStatusAndExpiresAtLessThanEqual(
                                ReservationStatus.ACTIVE,
                                now
                        );

        int releasedCount = 0;

        for (InventoryReservation reservation : expiredReservations) {
            expireReservation(reservation);
            releasedCount++;
        }

        return releasedCount;
    }

    private void expireReservation(InventoryReservation reservation) {
        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            return;
        }

        Integer productId = reservation.getProduct().getId();
        inventoryRepository.findByProductIdForUpdate(productId).ifPresent(inventory -> {
            int newReserved = inventory.getReservedQuantity() - reservation.getQuantity();
            inventory.setReservedQuantity(Math.max(0, newReserved));
            inventoryRepository.save(inventory);
        });

        reservation.setStatus(ReservationStatus.EXPIRED);
        inventoryReservationRepository.save(reservation);

        CustomerOrder order = reservation.getOrder();
        if (order != null && (order.getOrderStatus() == OrderStatus.PENDING_PAYMENT || order.getOrderStatus() == OrderStatus.PLACED)) {
            order.setOrderStatus(OrderStatus.CANCELLED);
            order.setUpdatedAt(LocalDateTime.now());
            customerOrderRepository.save(order);

            paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
                if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                    payment.setPaymentStatus(PaymentStatus.FAILED);
                    payment.setUpdatedAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                }
            });
        }
    }

    private InventoryReservation getReservation(Integer reservationId) {
        return inventoryReservationRepository.findById(reservationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Reservation not found with id: "
                                        + reservationId
                        )
                );
    }

    private InventoryReservationResponse mapToResponse(InventoryReservation reservation) {
        return new InventoryReservationResponse(
                reservation.getId(),
                reservation.getOrder().getId(),
                reservation.getProduct().getId(),
                reservation.getQuantity(),
                reservation.getReservedAt(),
                reservation.getExpiresAt(),
                reservation.getStatus()
        );
    }
}