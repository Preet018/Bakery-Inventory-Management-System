package com.bakery.inventory.service;

import com.bakery.inventory.dto.auth.EmailVerificationRequest;
import com.bakery.inventory.dto.auth.LoginRequest;
import com.bakery.inventory.dto.auth.LoginResponse;
import com.bakery.inventory.dto.useraccount.AccountDeleteRequest;
import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;
import com.bakery.inventory.dto.auth.PendingRegistration;
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

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
        private static final String ADMIN_ROLE = "ADMIN";
        private static final String CUSTOMER_ROLE = "CUSTOMER";

        private final UserAccountRepository userAccountRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;
        private final OtpService otpService;
        private final EmailService emailService;
        private final PendingRegistrationStore pendingRegistrationStore;

        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;

        private final SecureRandom secureRandom = new SecureRandom();

        private String generateOtp() {
                int otpNumber = secureRandom.nextInt(1_000_000);
                return String.format("%06d", otpNumber);
        }

        @Override
        public void registerCustomer(AccountRegistrationRequest request) {
                String username = request.getUsername().trim();
                String email = request.getEmail().trim().toLowerCase();

                if (userAccountRepository.findByUsername(username).isPresent()) {
                        throw new BusinessRuleException(
                                        "Username is already registered.");
                }

                if (userAccountRepository.findByEmail(email).isPresent()) {
                        throw new BusinessRuleException(
                                        "Email is already registered.");
                }

                if (pendingRegistrationStore.isUsernamePending(username, email)) {
                        throw new BusinessRuleException(
                                        "Username is currently reserved for a pending registration. Please choose another username.");
                }

                LocalDateTime now = LocalDateTime.now();
                Optional<PendingRegistration> existingPendingOpt = pendingRegistrationStore.findByEmail(email);
                if (existingPendingOpt.isPresent()) {
                        PendingRegistration existing = existingPendingOpt.get();
                        if (existing.getLastOtpSentAt() != null && existing.getLastOtpSentAt().plusSeconds(60).isAfter(now)) {
                                throw new BadRequestException(
                                                "Please wait before requesting another OTP.");
                        }
                }

                String otp = generateOtp();
                String passwordHash = passwordEncoder.encode(request.getPassword());
                String otpHash = passwordEncoder.encode(otp);

                PendingRegistration pending = PendingRegistration.builder()
                                .username(username)
                                .email(email)
                                .passwordHash(passwordHash)
                                .otpHash(otpHash)
                                .createdAt(now)
                                .expiresAt(now.plusMinutes(5))
                                .lastOtpSentAt(now)
                                .attempts(0)
                                .build();

                pendingRegistrationStore.save(pending);

                emailService.sendOtpEmail(email, otp, OtpPurpose.EMAIL_VERIFICATION);
        }

        @Override
        @Transactional
        public void registerInventoryManager(AccountRegistrationRequest request) {
                String username = request.getUsername().trim();

                String email = request.getEmail().trim().toLowerCase();

                if (userAccountRepository.findByUsername(username).isPresent()) {
                        throw new BusinessRuleException(
                                        "Username is already registered.");
                }

                if (userAccountRepository.findByEmail(email).isPresent()) {
                        throw new BusinessRuleException(
                                        "Email is already registered.");
                }

                Role inventoryManagerRole = roleRepository
                                .findByName("INVENTORY_MANAGER")
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory Manager role is not configured."));

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
                                                                request.getPassword()));

                CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

                if (!userDetails.isEmailVerified()) {
                        throw new EmailNotVerifiedException(
                                        "Your email is not verified. Please verify your email before logging in.");
                }

                String accessToken = jwtService.generateToken(userDetails);

                return new LoginResponse(
                                accessToken,
                                "Bearer",
                                jwtService.getExpirationInSeconds(),
                                userDetails.getUsername(),
                                userDetails.getRoleName());
        }

        @Override
        @Transactional
        public void verifyRegistration(EmailVerificationRequest request) {
                String email = request.getEmail().trim().toLowerCase();
                String otp = request.getOtp().trim();

                Optional<PendingRegistration> pendingOpt = pendingRegistrationStore.findByEmail(email);

                if (pendingOpt.isEmpty()) {
                        // Fallback check if user account already exists (e.g. manager or previously created user)
                        Optional<UserAccount> existingUserOpt = userAccountRepository.findByEmail(email);
                        if (existingUserOpt.isPresent()) {
                                verifyEmail(request);
                                return;
                        }
                        throw new BadRequestException(
                                        "No active registration found for this email, or the verification code has expired. Please register again.");
                }

                PendingRegistration pending = pendingOpt.get();
                LocalDateTime now = LocalDateTime.now();

                if (pending.getExpiresAt() != null && pending.getExpiresAt().isBefore(now)) {
                        pendingRegistrationStore.remove(email);
                        throw new BadRequestException(
                                        "Verification code has expired. Please register again.");
                }

                if (pending.getAttempts() >= 5) {
                        pendingRegistrationStore.remove(email);
                        throw new BadRequestException(
                                        "Maximum verification attempts exceeded. Please register again.");
                }

                pending.setAttempts(pending.getAttempts() + 1);

                boolean valid = passwordEncoder.matches(otp, pending.getOtpHash());
                if (!valid) {
                        pendingRegistrationStore.save(pending);
                        throw new BadRequestException(
                                        "Invalid or expired verification OTP.");
                }

                // Verify username and email uniqueness once more against DB
                if (userAccountRepository.findByUsername(pending.getUsername()).isPresent()) {
                        pendingRegistrationStore.remove(email);
                        throw new BusinessRuleException(
                                        "Username is already registered.");
                }
                if (userAccountRepository.findByEmail(pending.getEmail()).isPresent()) {
                        pendingRegistrationStore.remove(email);
                        throw new BusinessRuleException(
                                        "Email is already registered.");
                }

                Role customerRole = roleRepository.findByName(CUSTOMER_ROLE)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Customer role is not configured."));

                UserAccount user = new UserAccount();
                user.setUsername(pending.getUsername());
                user.setEmail(pending.getEmail());
                user.setPasswordHash(pending.getPasswordHash()); // already securely hashed
                user.setEmailVerified(true);
                user.setActive(true);
                user.setRole(customerRole);

                userAccountRepository.save(user);
                pendingRegistrationStore.remove(email);
        }

        @Override
        public void resendRegistrationOtp(String email) {
                String normalizedEmail = email.trim().toLowerCase();

                Optional<PendingRegistration> pendingOpt = pendingRegistrationStore.findByEmail(normalizedEmail);
                if (pendingOpt.isEmpty()) {
                        // Fallback: check if existing unverified user account exists (e.g. manager)
                        Optional<UserAccount> existingUserOpt = userAccountRepository.findByEmail(normalizedEmail);
                        if (existingUserOpt.isPresent()) {
                                requestVerificationOtp(normalizedEmail);
                                return;
                        }
                        throw new BadRequestException(
                                        "No active registration found for this email. Please register first.");
                }

                PendingRegistration pending = pendingOpt.get();
                LocalDateTime now = LocalDateTime.now();

                if (pending.getLastOtpSentAt() != null && pending.getLastOtpSentAt().plusSeconds(60).isAfter(now)) {
                        throw new BadRequestException(
                                        "Please wait before requesting another OTP.");
                }

                String otp = generateOtp();
                pending.setOtpHash(passwordEncoder.encode(otp));
                pending.setExpiresAt(now.plusMinutes(5));
                pending.setLastOtpSentAt(now);
                pending.setAttempts(0);

                pendingRegistrationStore.save(pending);
                emailService.sendOtpEmail(pending.getEmail(), otp, OtpPurpose.EMAIL_VERIFICATION);
        }

        @Override
        @Transactional
        public void verifyEmail(EmailVerificationRequest request) {
                String email = request.getEmail().trim().toLowerCase();

                // If this is a pending registration, delegate to verifyRegistration
                if (pendingRegistrationStore.findByEmail(email).isPresent()) {
                        verifyRegistration(request);
                        return;
                }

                UserAccount user = userAccountRepository
                                .findByEmail(email)
                                .orElseThrow(() -> new BadRequestException(
                                                "Invalid email or verification request."));

                if (!user.isActive()) {
                        throw new BadRequestException(
                                        "This account is inactive.");
                }

                if (user.isEmailVerified()) {
                        throw new BadRequestException(
                                        "Email is already verified.");
                }

                boolean valid = otpService.verifyOtp(user, OtpPurpose.EMAIL_VERIFICATION, request.getOtp());

                if (!valid) {
                        throw new BadRequestException(
                                        "Invalid or expired verification OTP.");
                }

                user.setEmailVerified(true);

                userAccountRepository.save(user);
        }

        @Override
        @Transactional
        public void requestVerificationOtp(String email) {
                String normalizedEmail = email.trim().toLowerCase();

                Optional<PendingRegistration> pendingOpt = pendingRegistrationStore.findByEmail(normalizedEmail);
                if (pendingOpt.isPresent()) {
                        resendRegistrationOtp(normalizedEmail);
                        return;
                }

                UserAccount user = userAccountRepository
                                .findByEmail(normalizedEmail)
                                .orElseThrow(() -> new BadRequestException(
                                                "Invalid email or verification request."));

                if (!user.isActive()) {
                        throw new BadRequestException(
                                        "This account is inactive.");
                }

                if (user.isEmailVerified()) {
                        throw new BadRequestException(
                                        "Email is already verified.");
                }

                otpService.generateAndSendOtp(user, OtpPurpose.EMAIL_VERIFICATION);
        }

        @Override
        @Transactional
        public void sendAccountDeletionOtp(Integer userId) {
                UserAccount user = userAccountRepository
                                .findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User account not found."));

                String roleName = user.getRole().getName();

                if (ADMIN_ROLE.equals(roleName)) {
                        throw new BusinessRuleException(
                                        "The ADMIN account cannot be deleted.");
                }

                if (!CUSTOMER_ROLE.equals(roleName) && !"INVENTORY_MANAGER".equals(roleName)) {
                        throw new BusinessRuleException(
                                        "This account cannot be deleted.");
                }

                if (!user.isActive()) {
                        throw new BusinessRuleException(
                                        "This account is already inactive.");
                }

                if (!user.isEmailVerified()) {
                        throw new BusinessRuleException(
                                        "Email must be verified before requesting account deletion.");
                }

                if (user.getEmail() == null || user.getEmail().isBlank()) {
                        throw new BusinessRuleException(
                                        "This account does not have a valid email address.");
                }

                otpService.generateAndSendOtp(
                                user,
                                OtpPurpose.ACCOUNT_DELETION);
        }

        @Override
        @Transactional
        public void deleteOwnAccount(Integer userId, AccountDeleteRequest request) {
                UserAccount user = userAccountRepository
                                .findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User account not found."));

                String roleName = user.getRole().getName();

                if (ADMIN_ROLE.equals(roleName)) {
                        throw new BusinessRuleException(
                                        "The ADMIN account cannot be deleted.");
                }

                if (!CUSTOMER_ROLE.equals(roleName) && !"INVENTORY_MANAGER".equals(roleName)) {
                        throw new BusinessRuleException(
                                        "This account cannot be deleted.");
                }

                if (!user.isActive()) {
                        throw new BusinessRuleException(
                                        "This account is already inactive.");
                }

                if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                        throw new BadRequestException(
                                        "Incorrect password.");
                }

                boolean otpValid = otpService.verifyOtp(user, OtpPurpose.ACCOUNT_DELETION, request.getOtp());

                if (!otpValid) {
                        throw new BadRequestException(
                                        "Invalid or expired account deletion OTP.");
                }

                user.setActive(false);
                user.setEmail(null);

                userAccountRepository.save(user);
        }

        // CHANGE: Send OTP to user's registered email for password reset (handles
        // non-existent/inactive accounts gracefully to prevent enumeration)
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
                                        .orElseThrow(() -> new BadRequestException(
                                                        "No registered account found with provided email."));
                } else {
                        user = userAccountRepository.findByUsername(identifier)
                                        .orElseThrow(() -> new BadRequestException(
                                                        "No registered account found with provided username."));
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