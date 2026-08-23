package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.CustomerRegistrationRequest;
import com.bakery.inventory.dto.auth.EmailVerificationRequest;
import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;

public interface AuthService {
    void registerCustomer(CustomerRegistrationRequest request);

    LoginResponse login(LoginRequest request);

    void verifyCustomerEmail(EmailVerificationRequest request);

    void resendCustomerVerificationOtp(String email);
}