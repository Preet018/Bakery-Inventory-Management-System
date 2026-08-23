package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.EmailVerificationRequest;
import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;
import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;

public interface AuthService {
    void registerCustomer(AccountRegistrationRequest request);

    void registerInventoryManager(AccountRegistrationRequest request);

    LoginResponse login(LoginRequest request);

    void verifyEmail(EmailVerificationRequest request);

    void resendVerificationOtp(String email);
}