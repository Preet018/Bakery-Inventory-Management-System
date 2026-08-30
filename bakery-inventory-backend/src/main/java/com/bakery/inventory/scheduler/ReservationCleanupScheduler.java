package com.bakery.inventory.scheduler;

import com.bakery.inventory.service.InventoryReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Background scheduler that periodically releases expired inventory reservations
 * for abandoned checkouts and dismissed/failed payment sessions.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationCleanupScheduler {

    private final InventoryReservationService inventoryReservationService;

    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredReservations() {
        try {
            int released = inventoryReservationService.releaseExpiredReservations();
            if (released > 0) {
                log.info("Released {} expired inventory reservation(s)", released);
            }
        } catch (Exception e) {
            log.error("Error occurred while executing expired reservations cleanup: {}", e.getMessage(), e);
        }
    }
}
