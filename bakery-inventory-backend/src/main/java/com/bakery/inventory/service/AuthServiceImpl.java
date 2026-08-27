package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.EmailVerificationRequest;
import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;
import com.bakery.inventory.dto.useraccount.AccountDeleteRequest;
import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;
import com.bakery.inventory.entity.OtpPurpose;
import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.BadRequestException;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.EmailNotVerifiedException;
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
    private static final String ADMIN_ROLE = "ADMIN";
    private static final String CUSTOMER_ROLE = "CUSTOMER";
    private static final String INVENTORY_MANAGER_ROLE = "INVENTORY_MANAGER";

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    @Transactional
    public void registerCustomer(AccountRegistrationRequest request) {
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
    @Transactional
    public void registerInventoryManager(AccountRegistrationRequest request) {
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

        Role inventoryManagerRole = roleRepository
                .findByName("INVENTORY_MANAGER")
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Inventory Manager role is not configured."
                        )
                );

        UserAccount user = new UserAccount();

        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        user.setEmail(email);
        user.setEmailVerified(false);

        user.setActive(true);
        user.setRole(inventoryManagerRole);

        userAccountRepository.save(user);
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

        if (!userDetails.isEmailVerified()) {
            throw new EmailNotVerifiedException(
                    "Your email is not verified. Please verify your email before logging in."
            );
        }

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
    public void verifyEmail(EmailVerificationRequest request) {
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
    public void requestVerificationOtp(String email) {
        String normalizedEmail = email.trim().toLowerCase();

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

    @Override
    @Transactional
    public void sendAccountDeletionOtp(Integer userId) {
        UserAccount user = userAccountRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User account not found."
                        )
                );

        String roleName = user.getRole().getName();

        if (ADMIN_ROLE.equals(roleName)) {
            throw new BusinessRuleException(
                    "The ADMIN account cannot be deleted."
            );
        }

        if (!CUSTOMER_ROLE.equals(roleName) && !"INVENTORY_MANAGER".equals(roleName)) {
            throw new BusinessRuleException(
                    "This account cannot be deleted."
            );
        }

        if (!user.isActive()) {
            throw new BusinessRuleException(
                    "This account is already inactive."
            );
        }

        if (!user.isEmailVerified()) {
            throw new BusinessRuleException(
                    "Email must be verified before requesting account deletion."
            );
        }

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new BusinessRuleException(
                    "This account does not have a valid email address."
            );
        }

        otpService.generateAndSendOtp(
                user,
                OtpPurpose.ACCOUNT_DELETION
        );
    }

    @Override
    @Transactional
    public void deleteOwnAccount(Integer userId, AccountDeleteRequest request) {
        UserAccount user = userAccountRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User account not found."
                        )
                );

        String roleName = user.getRole().getName();

        if (ADMIN_ROLE.equals(roleName)) {
            throw new BusinessRuleException(
                    "The ADMIN account cannot be deleted."
            );
        }

        if (!CUSTOMER_ROLE.equals(roleName) && !"INVENTORY_MANAGER".equals(roleName)) {
            throw new BusinessRuleException(
                    "This account cannot be deleted."
            );
        }

        if (!user.isActive()) {
            throw new BusinessRuleException(
                    "This account is already inactive."
            );
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException(
                    "Incorrect password."
            );
        }

        boolean otpValid = otpService.verifyOtp(user, OtpPurpose.ACCOUNT_DELETION, request.getOtp());

        if (!otpValid) {
            throw new BadRequestException(
                    "Invalid or expired account deletion OTP."
            );
        }

        user.setActive(false);
        user.setEmail(null);

        userAccountRepository.save(user);
    }

    // CHANGE: Send OTP to user's registered email for password reset (handles non-existent/inactive accounts gracefully to prevent enumeration)
    @Override
    @Transactional
    public void sendPasswordResetOtp(String usernameOrEmail) {
        String identifier = usernameOrEmail.trim();
        if (identifier.contains("@")) {
            identifier = identifier.toLowerCase();
        }

        java.util.Optional<UserAccount> userOpt = identifier.contains("@")
                ? userAccountRepository.findByEmail(identifier)
                : userAccountRepository.findByUsername(identifier);

        if (userOpt.isEmpty()) {
            // Return gracefully to prevent account enumeration
            return;
        }

        UserAccount user = userOpt.get();
        if (!user.isActive()) {
            // Return gracefully for inactive accounts
            return;
        }

        otpService.generateAndSendOtp(user, OtpPurpose.PASSWORD_RESET);
    }

    // CHANGE: Implemented changePassword via OTP verification
    @Override
    @Transactional
    public void changePassword(com.bakery.inventory.dto.auth.PasswordChangeRequest request) {
        String identifier = request.getUsernameOrEmail().trim();
        if (identifier.contains("@")) {
            identifier = identifier.toLowerCase();
        }

        UserAccount user;
        if (identifier.contains("@")) {
            user = userAccountRepository.findByEmail(identifier)
                    .orElseThrow(() -> new BadRequestException("No registered account found with provided email."));
        } else {
            user = userAccountRepository.findByUsername(identifier)
                    .orElseThrow(() -> new BadRequestException("No registered account found with provided username."));
        }

        if (!user.isActive()) {
            throw new BadRequestException("This account is inactive.");
        }

        // Verify OTP code with OtpPurpose.PASSWORD_RESET
        boolean otpValid = otpService.verifyOtp(user, OtpPurpose.PASSWORD_RESET, request.getOtp());
        if (!otpValid) {
            throw new BadRequestException("Invalid or expired password reset OTP code.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password cannot be the same as the current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);
    }
}