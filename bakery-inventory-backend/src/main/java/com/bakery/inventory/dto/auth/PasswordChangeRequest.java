package com.bakery.inventory.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

// NEW FILE: DTO for changing/updating account password
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PasswordChangeRequest {
    @NotBlank(message = "Username or email is required")
    @Size(max = 150, message = "Username or email must not exceed 150 characters")
    private String usernameOrEmail;

    // CHANGE: Use OTP verification code instead of current password
    @NotBlank(message = "OTP verification code is required")
    @jakarta.validation.constraints.Pattern(regexp = "\\d{6}", message = "OTP must be a 6-digit number")
    private String otp;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "New password must be between 8 and 100 characters")
    private String newPassword;
}
