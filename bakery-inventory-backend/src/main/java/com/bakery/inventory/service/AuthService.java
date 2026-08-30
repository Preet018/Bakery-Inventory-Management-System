package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.EmailVerificationRequest;
import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;
import com.bakery.inventory.dto.useraccount.AccountDeleteRequest;
import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;

import com.bakery.inventory.dto.auth.PasswordChangeRequest; // CHANGE: Added PasswordChangeRequest import

public interface AuthService {
    void registerCustomer(AccountRegistrationRequest request);

    void registerInventoryManager(AccountRegistrationRequest request);

    LoginResponse login(LoginRequest request);

    void verifyEmail(EmailVerificationRequest request);

    void requestVerificationOtp(String email);

    void verifyRegistration(EmailVerificationRequest request);

    void resendRegistrationOtp(String email);

    void sendAccountDeletionOtp(Integer userId);

    void deleteOwnAccount(Integer userId, AccountDeleteRequest request);

    void sendPasswordResetOtp(String usernameOrEmail); // CHANGE: Added method to send password reset OTP

    void changePassword(PasswordChangeRequest request); // CHANGE: Method to change password via OTP
}