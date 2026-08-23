package com.bakery.inventory.service;

import com.bakery.inventory.entity.OtpPurpose;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendOtpEmail(String recipientEmail, String otp, OtpPurpose purpose) {
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
    }
}