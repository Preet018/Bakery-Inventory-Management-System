package com.bakery.inventory.dto.useraccount;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDeletionOtpRequest {
    @NotBlank(message = "Admin email address is required.")
    @Email(message = "Please provide a valid email address.")
    private String adminEmail;
}
