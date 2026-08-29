package com.bakery.inventory.dto.useraccount;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDeletionConfirmRequest {
    @NotBlank(message = "Verification token is required.")
    private String verificationToken;
}
