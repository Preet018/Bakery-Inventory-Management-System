package com.bakery.inventory.service;

import com.bakery.inventory.entity.OtpPurpose;

public interface EmailService { // CHANGE
    void sendOtpEmail(String recipientEmail, String otp, OtpPurpose purpose);
}