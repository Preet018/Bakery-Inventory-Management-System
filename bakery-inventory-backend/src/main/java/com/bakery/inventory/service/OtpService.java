package com.bakery.inventory.service;

import com.bakery.inventory.entity.OtpPurpose;
import com.bakery.inventory.entity.UserAccount;

public interface OtpService {
    void generateAndSendOtp(UserAccount userAccount, OtpPurpose purpose);

    boolean verifyOtp(UserAccount userAccount, OtpPurpose purpose, String otp);
}