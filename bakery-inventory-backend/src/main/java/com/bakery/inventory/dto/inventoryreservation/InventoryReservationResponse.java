package com.bakery.inventory.dto.inventoryreservation;

import com.bakery.inventory.entity.ReservationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReservationResponse {
    private Integer id;
    private Integer orderId;
    private Integer productId;
    private Integer quantity;
    private LocalDateTime reservedAt;
    private LocalDateTime expiresAt;
    private ReservationStatus status;
}