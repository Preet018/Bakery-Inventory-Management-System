package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.PendingRegistration;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PendingRegistrationStore {

    private final Map<String, PendingRegistration> store = new ConcurrentHashMap<>();

    public void save(PendingRegistration pending) {
        if (pending != null && pending.getEmail() != null) {
            store.put(pending.getEmail().trim().toLowerCase(), pending);
        }
    }

    public Optional<PendingRegistration> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        String key = email.trim().toLowerCase();
        PendingRegistration pending = store.get(key);
        if (pending == null) {
            return Optional.empty();
        }
        if (pending.getExpiresAt() != null && pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            store.remove(key);
            return Optional.empty();
        }
        return Optional.of(pending);
    }

    public void remove(String email) {
        if (email != null) {
            store.remove(email.trim().toLowerCase());
        }
    }

    public boolean isUsernamePending(String username, String excludeEmail) {
        if (username == null || username.isBlank()) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        String excludeKey = excludeEmail != null ? excludeEmail.trim().toLowerCase() : "";

        return store.values().stream().anyMatch(pending -> {
            if (pending.getExpiresAt() != null && pending.getExpiresAt().isBefore(now)) {
                return false;
            }
            if (pending.getEmail() != null && pending.getEmail().trim().toLowerCase().equals(excludeKey)) {
                return false;
            }
            return username.trim().equalsIgnoreCase(pending.getUsername());
        });
    }

    @Scheduled(fixedRate = 60000)
    public void cleanupExpired() {
        LocalDateTime now = LocalDateTime.now();
        store.entrySet().removeIf(entry -> {
            PendingRegistration p = entry.getValue();
            return p == null || (p.getExpiresAt() != null && p.getExpiresAt().isBefore(now));
        });
    }
}
