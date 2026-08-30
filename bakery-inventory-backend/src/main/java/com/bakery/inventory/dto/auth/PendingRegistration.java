package com.bakery.inventory.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRegistration {
    private String username;
    private String email;
    private String passwordHash;
    private String otpHash;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime lastOtpSentAt;
    private int attempts;
}
