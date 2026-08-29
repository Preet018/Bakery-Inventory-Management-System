package com.bakery.inventory.dto.useraccount;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDeletionVerifyRequest {
    @NotBlank(message = "OTP verification code is required.")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be a 6-digit code.")
    private String otp;
}
