package com.bakery.inventory.security;

import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    private final String secret =
            "VGhpcyBpcyBhIHZlcnkgbG9uZyBzZWNyZXQga2V5IHRoYXQgaXMgYXQgbGVhc3QgMzIgdG8gNjQ";

    @BeforeEach
    void setUp() {
        jwtService =
                new JwtService(
                        secret,
                        900000
                );
    }

    private CustomUserDetails createUser(
            boolean active
    ) {
        Role role =
                new Role();

        role.setId(1);
        role.setName("CUSTOMER");

        UserAccount user =
                new UserAccount();

        user.setId(1);
        user.setUsername("customer");
        user.setPasswordHash("encoded-password");
        user.setRole(role);
        user.setActive(active);
        user.setEmailVerified(true);

        return new CustomUserDetails(user);
    }

    @Test
    void generateToken_shouldContainUsername() {
        CustomUserDetails user =
                createUser(true);

        String token =
                jwtService.generateToken(user);

        assertNotNull(token);
        assertEquals(
                "customer",
                jwtService.extractUsername(token)
        );
    }

    @Test
    void isTokenValid_shouldReturnTrue_forActiveUser() {
        CustomUserDetails user =
                createUser(true);

        String token =
                jwtService.generateToken(user);

        assertTrue(
                jwtService.isTokenValid(
                        token,
                        user
                )
        );
    }

    @Test
    void isTokenValid_shouldReturnFalse_forInactiveUser() {
        CustomUserDetails activeUser =
                createUser(true);

        String token =
                jwtService.generateToken(activeUser);

        CustomUserDetails inactiveUser =
                createUser(false);

        assertFalse(
                jwtService.isTokenValid(
                        token,
                        inactiveUser
                )
        );
    }
}