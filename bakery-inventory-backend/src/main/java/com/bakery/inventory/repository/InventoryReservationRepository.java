package com.bakery.inventory.repository;

import com.bakery.inventory.entity.InventoryReservation;
import com.bakery.inventory.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Integer> {
    Optional<InventoryReservation> findByOrderIdAndProductId(Integer orderId, Integer productId);

    List<InventoryReservation> findByOrderIdAndStatusOrderByProductIdAsc(Integer orderId, ReservationStatus status);

    List<InventoryReservation> findByOrderIdAndStatus(Integer orderId, ReservationStatus status);

    List<InventoryReservation> findByStatusAndExpiresAtLessThanEqual(ReservationStatus status, LocalDateTime expiresAt);
}