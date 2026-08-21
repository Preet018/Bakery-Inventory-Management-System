package com.bakery.inventory.service;

import com.bakery.inventory.dto.inventoryreservation.InventoryReservationResponse;

import java.util.List;

public interface InventoryReservationService {
    InventoryReservationResponse reserve(Integer orderId, Integer productId, Integer quantity);

    InventoryReservationResponse release(Integer reservationId);

    List<InventoryReservationResponse> releaseByOrderId(Integer orderId);

    InventoryReservationResponse convert(Integer reservationId);

    List<InventoryReservationResponse> convertByOrderId(Integer orderId);

    int releaseExpiredReservations();
}