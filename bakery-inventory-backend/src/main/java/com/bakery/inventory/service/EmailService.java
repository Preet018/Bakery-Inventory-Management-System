package com.bakery.inventory.service;

import com.bakery.inventory.entity.OtpPurpose;
import org.springframework.scheduling.annotation.Async;

// CHANGE: Added @Async annotation to EmailService interface
public interface EmailService {
    @Async
    void sendOtpEmail(String recipientEmail, String otp, OtpPurpose purpose);
}