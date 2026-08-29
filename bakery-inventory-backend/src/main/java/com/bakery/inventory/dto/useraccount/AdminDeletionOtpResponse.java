package com.bakery.inventory.dto.useraccount;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDeletionOtpResponse {
    private String message;
    private String maskedEmail;
}
