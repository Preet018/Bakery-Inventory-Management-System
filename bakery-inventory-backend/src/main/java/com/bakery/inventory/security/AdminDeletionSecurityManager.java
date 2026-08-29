package com.bakery.inventory.security;

import com.bakery.inventory.exception.BadRequestException;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe, encapsulated server-side session store for Admin deletion authorizations.
 * Maintains target-bound pending OTP sessions and atomic single-use final authorization tokens
 * without modifying database schemas.
 */
@Component
public class AdminDeletionSecurityManager {

    @Data
    @AllArgsConstructor
    public static class PendingOtpSession {
        private final Integer adminUserId;
        private final Integer targetManagerId;
        private final LocalDateTime expiresAt;
    }

    @Data
    @AllArgsConstructor
    public static class FinalAuthSession {
        private final Integer adminUserId;
        private final Integer targetManagerId;
        private final String verificationToken;
        private final LocalDateTime expiresAt;
        private final boolean verified;
        private boolean consumed;
    }

    private final ConcurrentHashMap<Integer, PendingOtpSession> pendingOtpSessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, FinalAuthSession> finalAuthSessions = new ConcurrentHashMap<>();

    /**
     * Creates or replaces a pending OTP deletion session bound to the authenticated Admin and target Manager.
     */
    public void createPendingOtpSession(Integer adminUserId, Integer targetManagerId, int expiryMinutes) {
        pendingOtpSessions.put(
                adminUserId,
                new PendingOtpSession(
                        adminUserId,
                        targetManagerId,
                        LocalDateTime.now().plusMinutes(expiryMinutes)
                )
        );
    }

    /**
     * Validates that an active, unexpired pending session exists and strictly matches the targetManagerId.
     */
    public void validatePendingOtpSession(Integer adminUserId, Integer targetManagerId) {
        PendingOtpSession session = pendingOtpSessions.get(adminUserId);
        LocalDateTime now = LocalDateTime.now();

        if (session == null || session.getExpiresAt().isBefore(now)) {
            pendingOtpSessions.remove(adminUserId);
            throw new BadRequestException("No active deletion verification session found. Please request a new verification code.");
        }

        if (!session.getTargetManagerId().equals(targetManagerId)) {
            throw new BadRequestException("Verification code was requested for a different manager account. Please request a new verification code for this manager.");
        }
    }

    /**
     * Cleans up pending OTP session for an Admin.
     */
    public void removePendingOtpSession(Integer adminUserId) {
        pendingOtpSessions.remove(adminUserId);
    }

    /**
     * Issues an opaque, cryptographically random single-use final authorization token.
     */
    public String createFinalAuthSession(Integer adminUserId, Integer targetManagerId, int expiryMinutes) {
        String token = UUID.randomUUID().toString();
        finalAuthSessions.put(
                token,
                new FinalAuthSession(
                        adminUserId,
                        targetManagerId,
                        token,
                        LocalDateTime.now().plusMinutes(expiryMinutes),
                        true,
                        false
                )
        );
        return token;
    }

    /**
     * Atomically validates and consumes the final deletion authorization token.
     */
    public synchronized void consumeFinalAuthSession(Integer adminUserId, Integer targetManagerId, String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Verification token is required for permanent deletion.");
        }

        FinalAuthSession session = finalAuthSessions.get(token);
        if (session == null) {
            throw new BadRequestException("Invalid or expired deletion authorization token. Please verify your identity again.");
        }

        if (session.isConsumed()) {
            finalAuthSessions.remove(token);
            throw new BadRequestException("Deletion authorization token has already been used.");
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            finalAuthSessions.remove(token);
            throw new BadRequestException("Deletion authorization token has expired. Please verify your identity again.");
        }

        if (!session.getAdminUserId().equals(adminUserId)) {
            throw new BadRequestException("Deletion authorization token does not belong to the authenticated administrator.");
        }

        if (!session.getTargetManagerId().equals(targetManagerId)) {
            throw new BadRequestException("Deletion authorization token was issued for a different manager account.");
        }

        if (!session.isVerified()) {
            throw new BadRequestException("Deletion authorization has not been verified.");
        }

        session.setConsumed(true);
        finalAuthSessions.remove(token);
    }

    /**
     * Clear all sessions (helper for unit tests).
     */
    public void clearAll() {
        pendingOtpSessions.clear();
        finalAuthSessions.clear();
    }
}
