package com.bakery.inventory.service;

import com.bakery.inventory.entity.OtpPurpose;
import com.bakery.inventory.entity.OtpVerification;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.BadRequestException;
import com.bakery.inventory.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final OtpVerificationRepository otpVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public void generateAndSendOtp(UserAccount userAccount, OtpPurpose purpose) {
        LocalDateTime now = LocalDateTime.now();

        OtpVerification latestVerification = otpVerificationRepository
                        .findTopByUserAccountIdAndPurposeAndUsedAtIsNullOrderByCreatedAtDesc(
                                userAccount.getId(),
                                purpose
                        )
                        .orElse(null);

        if (latestVerification != null && latestVerification.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(now)) {

            throw new BadRequestException(
                    "Please wait before requesting another OTP."
            );
        }

        otpVerificationRepository.invalidateActiveVerifications(userAccount.getId(), purpose);

        String otp = generateOtp();

        OtpVerification verification = new OtpVerification();

        verification.setUserAccount(userAccount);
        verification.setCodeHash(passwordEncoder.encode(otp));
        verification.setPurpose(purpose);
        verification.setExpiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES));
        verification.setAttempts(0);
        verification.setCreatedAt(now);

        otpVerificationRepository.save(verification);

        emailService.sendOtpEmail(userAccount.getEmail(), otp, purpose);
    }

    @Override
    @Transactional
    public boolean verifyOtp(UserAccount userAccount, OtpPurpose purpose, String otp) {
        OtpVerification verification = otpVerificationRepository
                        .findTopByUserAccountIdAndPurposeAndUsedAtIsNullOrderByCreatedAtDesc(
                                userAccount.getId(),
                                purpose
                        )
                        .orElse(null);

        if (verification == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        if (verification.getExpiresAt().isBefore(now)) {
            return false;
        }

        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            return false;
        }

        verification.setAttempts(verification.getAttempts() + 1);

        boolean valid = passwordEncoder.matches(otp, verification.getCodeHash());

        if (!valid) {
            otpVerificationRepository.save(verification);
            return false;
        }

        verification.setUsedAt(now);

        otpVerificationRepository.save(verification);

        return true;
    }

    private String generateOtp() {
        int otpNumber = secureRandom.nextInt(1_000_000);

        return String.format("%06d", otpNumber);
    }
}