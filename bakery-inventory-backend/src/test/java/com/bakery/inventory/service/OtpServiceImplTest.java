package com.bakery.inventory.service;

import com.bakery.inventory.entity.OtpPurpose;
import com.bakery.inventory.entity.OtpVerification;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.repository.OtpVerificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceImplTest {

    @Mock
    private OtpVerificationRepository otpVerificationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private OtpServiceImpl otpService;

    private UserAccount createUser() {
        UserAccount user = new UserAccount();
        user.setId(1);
        user.setEmail("customer@test.com");
        user.setUsername("customer");
        user.setEmailVerified(false);
        user.setActive(true);
        return user;
    }

    private OtpVerification createVerification(
            UserAccount user,
            LocalDateTime expiresAt
    ) {
        OtpVerification verification =
                new OtpVerification();

        verification.setId(1L);
        verification.setUserAccount(user);
        verification.setCodeHash("encoded-otp");
        verification.setPurpose(
                OtpPurpose.EMAIL_VERIFICATION
        );
        verification.setExpiresAt(expiresAt);
        verification.setAttempts(0);
        verification.setCreatedAt(
                LocalDateTime.now().minusMinutes(1)
        );

        return verification;
    }

    @Test
    void verifyOtp_shouldReturnTrue_whenOtpIsValid() {
        UserAccount user = createUser();

        OtpVerification verification =
                createVerification(
                        user,
                        LocalDateTime.now().plusMinutes(5)
                );

        when(otpVerificationRepository
                .findTopByUserAccountIdAndPurposeAndUsedAtIsNullOrderByCreatedAtDesc(
                        1,
                        OtpPurpose.EMAIL_VERIFICATION
                ))
                .thenReturn(Optional.of(verification));

        when(passwordEncoder.matches(
                "123456",
                "encoded-otp"
        )).thenReturn(true);

        boolean result =
                otpService.verifyOtp(
                        user,
                        OtpPurpose.EMAIL_VERIFICATION,
                        "123456"
                );

        assertTrue(result);
        assertEquals(1, verification.getAttempts());
        assertNotNull(verification.getUsedAt());

        verify(otpVerificationRepository)
                .save(verification);
    }

    @Test
    void verifyOtp_shouldReturnFalse_whenOtpIsInvalid() {
        UserAccount user = createUser();

        OtpVerification verification =
                createVerification(
                        user,
                        LocalDateTime.now().plusMinutes(5)
                );

        when(otpVerificationRepository
                .findTopByUserAccountIdAndPurposeAndUsedAtIsNullOrderByCreatedAtDesc(
                        1,
                        OtpPurpose.EMAIL_VERIFICATION
                ))
                .thenReturn(Optional.of(verification));

        when(passwordEncoder.matches(
                "wrong-otp",
                "encoded-otp"
        )).thenReturn(false);

        boolean result =
                otpService.verifyOtp(
                        user,
                        OtpPurpose.EMAIL_VERIFICATION,
                        "wrong-otp"
                );

        assertFalse(result);
        assertEquals(1, verification.getAttempts());
        assertNull(verification.getUsedAt());

        verify(otpVerificationRepository)
                .save(verification);
    }

    @Test
    void verifyOtp_shouldReturnFalse_whenOtpIsExpired() {
        UserAccount user = createUser();

        OtpVerification verification =
                createVerification(
                        user,
                        LocalDateTime.now().minusMinutes(1)
                );

        when(otpVerificationRepository
                .findTopByUserAccountIdAndPurposeAndUsedAtIsNullOrderByCreatedAtDesc(
                        1,
                        OtpPurpose.EMAIL_VERIFICATION
                ))
                .thenReturn(Optional.of(verification));

        boolean result =
                otpService.verifyOtp(
                        user,
                        OtpPurpose.EMAIL_VERIFICATION,
                        "123456"
                );

        assertFalse(result);

        verify(passwordEncoder, never())
                .matches(anyString(), anyString());

        verify(otpVerificationRepository, never())
                .save(any(OtpVerification.class));
    }
}