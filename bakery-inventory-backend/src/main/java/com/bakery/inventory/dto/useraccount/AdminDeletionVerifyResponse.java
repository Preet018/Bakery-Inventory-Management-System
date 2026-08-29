package com.bakery.inventory.dto.useraccount;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDeletionVerifyResponse {
    private String message;
    private String verificationToken;
}
