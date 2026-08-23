package com.bakery.inventory.dto.auth;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;

    private String tokenType;

    private long expiresIn;

    private String username;

    private String role;
}