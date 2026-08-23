package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.CustomerRegistrationRequest;
import com.bakery.inventory.dto.auth.EmailVerificationRequest;
import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;
import com.bakery.inventory.entity.OtpPurpose;
import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.BadRequestException;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.ResourceNotFoundException;
import com.bakery.inventory.repository.RoleRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import com.bakery.inventory.security.CustomUserDetails;
import com.bakery.inventory.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private static final String CUSTOMER_ROLE = "CUSTOMER";

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    @Transactional
    public void registerCustomer(CustomerRegistrationRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (userAccountRepository.findByUsername(username).isPresent()) {
            throw new BusinessRuleException(
                    "Username is already registered."
            );
        }

        if (userAccountRepository.findByEmail(email).isPresent()) {
            throw new BusinessRuleException(
                    "Email is already registered."
            );
        }

        Role customerRole = roleRepository.findByName(CUSTOMER_ROLE)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer role is not configured."
                        )
                );

        UserAccount user = new UserAccount();

        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(email);
        user.setEmailVerified(false);
        user.setActive(true);
        user.setRole(customerRole);

        UserAccount savedUser = userAccountRepository.save(user);

        otpService.generateAndSendOtp(savedUser, OtpPurpose.EMAIL_VERIFICATION);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmail().trim();

        if (identifier.contains("@")) {
            identifier = identifier.toLowerCase();
        }

        Authentication authentication = authenticationManager
                .authenticate(
                        new UsernamePasswordAuthenticationToken(
                                identifier,
                                request.getPassword()
                        )
                );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        String accessToken = jwtService.generateToken(userDetails);

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtService.getExpirationInSeconds(),
                userDetails.getUsername(),
                userDetails.getRoleName()
        );
    }

    @Override
    @Transactional
    public void verifyCustomerEmail(EmailVerificationRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        UserAccount user = userAccountRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new BadRequestException(
                                "Invalid email or verification request."
                        )
                );

        if (!user.isActive()) {
            throw new BadRequestException(
                    "This account is inactive."
            );
        }

        if (user.isEmailVerified()) {
            throw new BadRequestException(
                    "Email is already verified."
            );
        }

        boolean valid = otpService.verifyOtp(user, OtpPurpose.EMAIL_VERIFICATION, request.getOtp());

        if (!valid) {
            throw new BadRequestException(
                    "Invalid or expired verification OTP."
            );
        }

        user.setEmailVerified(true);

        userAccountRepository.save(user);
    }

    @Override
    @Transactional
    public void resendCustomerVerificationOtp(String email) {
        String normalizedEmail = email
                .trim()
                .toLowerCase();

        UserAccount user = userAccountRepository
                .findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new BadRequestException(
                                "Invalid email or verification request."
                        )
                );

        if (!user.isActive()) {
            throw new BadRequestException(
                    "This account is inactive."
            );
        }

        if (user.isEmailVerified()) {
            throw new BadRequestException(
                    "Email is already verified."
            );
        }

        otpService.generateAndSendOtp(user, OtpPurpose.EMAIL_VERIFICATION);
    }
}