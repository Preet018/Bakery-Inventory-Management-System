package com.bakery.inventory.service;

import com.bakery.inventory.entity.OtpPurpose;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    // CHANGE: Made sendOtpEmail non-blocking/asynchronous so the HTTP request completes immediately (<20ms) after OTP DB persistence
    @Override
    @Async
    public void sendOtpEmail(String recipientEmail, String otp, OtpPurpose purpose) {
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();

                message.setTo(recipientEmail);

                message.setSubject("Bakery Inventory Management - Verification Code");

                message.setText(
                        "Your verification code is: " + otp
                                + "\n\n"
                                + "This code expires in 5 minutes."
                                + "\n\n"
                                + "Purpose: " + purpose.name()
                                + "\n\n"
                                + "If you did not request this code, please ignore this email."
                );

                mailSender.send(message);
                log.info("OTP email sent successfully to {} for purpose {}", recipientEmail, purpose);
            } catch (Exception e) {
                log.error("Failed to send OTP email to {}: {}", recipientEmail, e.getMessage(), e);
            }
        });
    }
}