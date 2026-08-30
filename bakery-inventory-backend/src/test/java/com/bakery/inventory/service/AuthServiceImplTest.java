package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;
import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.EmailNotVerifiedException;
import com.bakery.inventory.security.CustomUserDetails;
import com.bakery.inventory.security.JwtService;
import com.bakery.inventory.entity.OtpPurpose;
import com.bakery.inventory.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.bakery.inventory.dto.auth.EmailVerificationRequest;
import com.bakery.inventory.dto.auth.PendingRegistration;
import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;
import com.bakery.inventory.repository.RoleRepository;
import com.bakery.inventory.service.EmailService;
import com.bakery.inventory.service.PendingRegistrationStore;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private Authentication authentication;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OtpService otpService;

    @Mock
    private EmailService emailService;

    @Mock
    private PendingRegistrationStore pendingRegistrationStore;

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

    @Test
    void sendPasswordResetOtp_shouldGenerateOtp_whenUserExistsAndIsActive() {
        UserAccount user = createUser(1, "customer", "CUSTOMER", true, true);
        when(userAccountRepository.findByUsername("customer")).thenReturn(Optional.of(user));

        authService.sendPasswordResetOtp("customer");

        verify(otpService).generateAndSendOtp(user, OtpPurpose.PASSWORD_RESET);
    }

    @Test
    void sendPasswordResetOtp_shouldReturnGracefully_whenUserDoesNotExist() {
        when(userAccountRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> authService.sendPasswordResetOtp("nonexistent"));

        verify(otpService, never()).generateAndSendOtp(any(), any());
    }

    @Test
    void sendPasswordResetOtp_shouldReturnGracefully_whenUserIsInactive() {
        UserAccount user = createUser(1, "inactive_user", "CUSTOMER", false, true);
        when(userAccountRepository.findByUsername("inactive_user")).thenReturn(Optional.of(user));

        assertDoesNotThrow(() -> authService.sendPasswordResetOtp("inactive_user"));

        verify(otpService, never()).generateAndSendOtp(any(), any());
    }

    @Test
    void registerCustomer_shouldSaveToPendingStoreAndSendOtp_withoutCreatingUserAccount() {
        AccountRegistrationRequest request = new AccountRegistrationRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setPassword("password123");

        when(userAccountRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());
        when(pendingRegistrationStore.isUsernamePending("newuser", "newuser@example.com")).thenReturn(false);
        when(pendingRegistrationStore.findByEmail("newuser@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedValue");

        authService.registerCustomer(request);

        // Verify PendingRegistration saved
        verify(pendingRegistrationStore).save(any(PendingRegistration.class));
        // Verify email sent with OTP
        verify(emailService).sendOtpEmail(eq("newuser@example.com"), anyString(), eq(OtpPurpose.EMAIL_VERIFICATION));
        // Verify user account was NOT created in DB
        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void verifyRegistration_shouldCreateUserAccount_whenOtpIsValid() {
        PendingRegistration pending = PendingRegistration.builder()
                .username("newuser")
                .email("newuser@example.com")
                .passwordHash("hashedPassword")
                .otpHash("hashedOtp")
                .createdAt(java.time.LocalDateTime.now())
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .build();

        Role role = new Role();
        role.setId(1);
        role.setName("CUSTOMER");

        when(pendingRegistrationStore.findByEmail("newuser@example.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("123456", "hashedOtp")).thenReturn(true);
        when(userAccountRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName("CUSTOMER")).thenReturn(Optional.of(role));

        EmailVerificationRequest request = new EmailVerificationRequest();
        request.setEmail("newuser@example.com");
        request.setOtp("123456");

        authService.verifyRegistration(request);

        // Verify UserAccount created with emailVerified = true
        verify(userAccountRepository).save(argThat(user ->
                user.getUsername().equals("newuser") &&
                user.getEmail().equals("newuser@example.com") &&
                user.getPasswordHash().equals("hashedPassword") &&
                user.isEmailVerified() &&
                user.isActive()
        ));
        // Verify pending registration removed
        verify(pendingRegistrationStore).remove("newuser@example.com");
    }

    @Test
    void verifyRegistration_shouldThrowException_whenOtpIsInvalid() {
        PendingRegistration pending = PendingRegistration.builder()
                .username("newuser")
                .email("newuser@example.com")
                .passwordHash("hashedPassword")
                .otpHash("hashedOtp")
                .createdAt(java.time.LocalDateTime.now())
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .build();

        when(pendingRegistrationStore.findByEmail("newuser@example.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("999999", "hashedOtp")).thenReturn(false);

        EmailVerificationRequest request = new EmailVerificationRequest();
        request.setEmail("newuser@example.com");
        request.setOtp("999999");

        assertThrows(com.bakery.inventory.exception.BadRequestException.class, () ->
                authService.verifyRegistration(request)
        );

        // UserAccount must not be saved
        verify(userAccountRepository, never()).save(any());
        verify(pendingRegistrationStore, never()).remove("newuser@example.com");
    }
}