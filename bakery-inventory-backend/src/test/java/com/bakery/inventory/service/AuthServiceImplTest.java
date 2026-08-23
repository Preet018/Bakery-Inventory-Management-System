package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;
import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.EmailNotVerifiedException;
import com.bakery.inventory.security.CustomUserDetails;
import com.bakery.inventory.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthServiceImpl authService;

    private UserAccount createUser(
            Integer id,
            String username,
            String roleName,
            boolean active,
            boolean emailVerified
    ) {
        Role role = new Role();
        role.setId(1);
        role.setName(roleName);

        UserAccount user = new UserAccount();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@test.com");
        user.setActive(active);
        user.setEmailVerified(emailVerified);
        user.setRole(role);

        return user;
    }

    @Test
    void login_shouldReturnToken_whenCredentialsAreValid() {

        UserAccount user = createUser(
                1,
                "customer",
                "CUSTOMER",
                true,
                true
        );

        CustomUserDetails userDetails =
                new CustomUserDetails(user);

        LoginRequest request =
                new LoginRequest(
                        "customer",
                        "password123"
                );

        when(authenticationManager.authenticate(any()))
                .thenReturn(authentication);

        when(authentication.getPrincipal())
                .thenReturn(userDetails);

        when(jwtService.generateToken(userDetails))
                .thenReturn("jwt-token");

        when(jwtService.getExpirationInSeconds())
                .thenReturn(3600L);

        LoginResponse response =
                authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(3600L, response.getExpiresIn());
        assertEquals("customer", response.getUsername());
        assertEquals("CUSTOMER", response.getRole());

        verify(authenticationManager)
                .authenticate(any());

        verify(jwtService)
                .generateToken(userDetails);
    }

    @Test
    void login_shouldThrowException_whenCredentialsAreInvalid() {

        LoginRequest request =
                new LoginRequest(
                        "customer",
                        "wrong-password"
                );

        when(authenticationManager.authenticate(any()))
                .thenThrow(
                        new BadCredentialsException(
                                "Bad credentials"
                        )
                );

        assertThrows(
                BadCredentialsException.class,
                () -> authService.login(request)
        );

        // CHANGE: JWT must not be generated after authentication failure.
        verify(jwtService, never())
                .generateToken(any());
    }

    @Test
    void login_shouldThrowException_whenEmailIsNotVerified() {

        UserAccount user = createUser(
                1,
                "customer",
                "CUSTOMER",
                true,
                false
        );

        CustomUserDetails userDetails =
                new CustomUserDetails(user);

        LoginRequest request =
                new LoginRequest(
                        "customer",
                        "password123"
                );

        when(authenticationManager.authenticate(any()))
                .thenReturn(authentication);

        when(authentication.getPrincipal())
                .thenReturn(userDetails);

        EmailNotVerifiedException exception =
                assertThrows(
                        EmailNotVerifiedException.class,
                        () -> authService.login(request)
                );

        assertEquals(
                "Your email is not verified. Please verify your email before logging in.",
                exception.getMessage()
        );

        verify(jwtService, never())
                .generateToken(any());
    }
}