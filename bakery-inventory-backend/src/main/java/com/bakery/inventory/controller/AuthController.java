package com.bakery.inventory.controller;

import com.bakery.inventory.dto.auth.EmailVerificationRequest;
import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;
import com.bakery.inventory.dto.useraccount.AccountDeleteRequest;
import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;
import com.bakery.inventory.security.CustomUserDetails;
import com.bakery.inventory.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> registerCustomer(@Valid @RequestBody AccountRegistrationRequest request) {
        authService.registerCustomer(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        "Customer registered successfully. "
                        + "Please verify your email using the OTP sent to you."
                );
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@Valid @RequestBody EmailVerificationRequest request) {
        authService.verifyEmail(request);

        return ResponseEntity.ok(
                "Email verified successfully. You can now log in."
        );
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerificationOtp(@NotBlank(message = "Email is required") @Email(message = "Email must be valid") @Size(max = 150, message = "Email must not exceed 150 characters") @RequestParam String email) {
        authService.resendVerificationOtp(email);

        return ResponseEntity.ok(
                "A new verification OTP has been sent to your email."
        );
    }

    @PostMapping("/account-deletion/otp")
    public ResponseEntity<String> requestAccountDeletionOtp(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        authService.sendAccountDeletionOtp(userDetails.getUserId());

        return ResponseEntity.ok(
                "Account deletion OTP has been sent to your registered email."
        );
    }

    @DeleteMapping("/account")
    public ResponseEntity<String> deleteOwnAccount(Authentication authentication, @Valid @RequestBody AccountDeleteRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        authService.deleteOwnAccount(userDetails.getUserId(), request);

        return ResponseEntity.ok(
                "Account deleted successfully."
        );
    }
}