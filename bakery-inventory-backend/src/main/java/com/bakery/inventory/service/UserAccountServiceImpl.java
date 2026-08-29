package com.bakery.inventory.service;

import com.bakery.inventory.dto.useraccount.*;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.ResourceNotFoundException;
import com.bakery.inventory.repository.OtpVerificationRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAccountServiceImpl implements UserAccountService {
        private static final String ADMIN_ROLE = "ADMIN";
        private static final String INVENTORY_MANAGER_ROLE = "INVENTORY_MANAGER";

        private final UserAccountRepository userAccountRepository;
        private final OtpVerificationRepository otpVerificationRepository;
        private final OtpService otpService;
        private final com.bakery.inventory.security.AdminDeletionSecurityManager adminDeletionSecurityManager;

        @Override
        public List<UserAccountResponse> getAllUsers() {
                return userAccountRepository.findAll()
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        @Override
        public List<UserAccountResponse> getInventoryManagers() {
                return userAccountRepository.findAllByRole_Name(INVENTORY_MANAGER_ROLE)
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        @Override
        public UserAccountResponse getUserById(Integer id) {
                UserAccount user = userAccountRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found with id: " + id));

                return mapToResponse(user);
        }

        @Override
        public UserAccountResponse updateUser(Integer id, UserAccountUpdateRequest request) {
                UserAccount user = userAccountRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found with id: " + id));

                user.setUsername(request.getUsername());
                user.setEmail(request.getEmail());

                UserAccount updatedUser = userAccountRepository.save(user);

                return mapToResponse(updatedUser);
        }

        @Override
        @Transactional
        public AdminDeletionOtpResponse requestDeletionOtp(Integer adminUserId, Integer targetManagerId, AdminDeletionOtpRequest request) {
                UserAccount admin = userAccountRepository.findById(adminUserId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Authenticated administrator account not found."));

                if (admin.getRole() == null || !ADMIN_ROLE.equals(admin.getRole().getName())) {
                        throw new BusinessRuleException("Only administrators can request deletion verification.");
                }

                if (!admin.isActive()) {
                        throw new BusinessRuleException("Administrator account is inactive.");
                }

                if (!admin.isEmailVerified() || admin.getEmail() == null || admin.getEmail().isBlank()) {
                        throw new BusinessRuleException("Administrator email must be verified before performing deletions.");
                }

                UserAccount targetManager = userAccountRepository.findById(targetManagerId)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory Manager account not found."));

                if (targetManager.getRole() == null || !INVENTORY_MANAGER_ROLE.equals(targetManager.getRole().getName())) {
                        throw new BusinessRuleException("Target account is not an Inventory Manager.");
                }

                if (request.getAdminEmail() == null || !admin.getEmail().trim().equalsIgnoreCase(request.getAdminEmail().trim())) {
                        throw new com.bakery.inventory.exception.BadRequestException(
                                        "The entered email does not match your registered administrator email address.");
                }

                otpService.generateAndSendOtp(admin, com.bakery.inventory.entity.OtpPurpose.ADMIN_INVENTORY_MANAGER_DELETION);
                adminDeletionSecurityManager.createPendingOtpSession(adminUserId, targetManagerId, 5);

                return new AdminDeletionOtpResponse(
                                "Verification OTP sent successfully to your registered administrator email address.",
                                maskEmail(admin.getEmail())
                );
        }

        @Override
        @Transactional
        public AdminDeletionVerifyResponse verifyDeletionOtp(Integer adminUserId, Integer targetManagerId, AdminDeletionVerifyRequest request) {
                adminDeletionSecurityManager.validatePendingOtpSession(adminUserId, targetManagerId);

                UserAccount admin = userAccountRepository.findById(adminUserId)
                                .orElseThrow(() -> new ResourceNotFoundException("Administrator account not found."));

                boolean valid = otpService.verifyOtp(
                                admin,
                                com.bakery.inventory.entity.OtpPurpose.ADMIN_INVENTORY_MANAGER_DELETION,
                                request.getOtp().trim()
                );

                if (!valid) {
                        throw new com.bakery.inventory.exception.BadRequestException("Invalid or expired verification code. Please try again.");
                }

                adminDeletionSecurityManager.removePendingOtpSession(adminUserId);
                String token = adminDeletionSecurityManager.createFinalAuthSession(adminUserId, targetManagerId, 5);

                return new AdminDeletionVerifyResponse("Admin identity and OTP verified successfully.", token);
        }

        @Override
        @Transactional
        public void confirmDeleteInventoryManager(Integer adminUserId, Integer targetManagerId, AdminDeletionConfirmRequest request) {
                adminDeletionSecurityManager.consumeFinalAuthSession(adminUserId, targetManagerId, request.getVerificationToken().trim());

                UserAccount targetManager = userAccountRepository.findById(targetManagerId)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory Manager account not found."));

                if (targetManager.getRole() == null || !INVENTORY_MANAGER_ROLE.equals(targetManager.getRole().getName())) {
                        throw new BusinessRuleException("Only INVENTORY_MANAGER accounts can be deleted through this operation.");
                }

                try {
                        otpVerificationRepository.deleteByUserAccountId(targetManager.getId());
                        userAccountRepository.delete(targetManager);
                        userAccountRepository.flush();
                } catch (Exception e) {
                        throw new BusinessRuleException(
                                        "Cannot permanently delete Inventory Manager account because existing database records/relationships prevent deletion.");
                }
        }


        @Override
        @Transactional
        public void deactivateInventoryManager(Integer id) {
                UserAccount user = userAccountRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User account not found."));

                if (!INVENTORY_MANAGER_ROLE.equals(user.getRole().getName())) {
                        throw new BusinessRuleException(
                                        "Only INVENTORY_MANAGER accounts can be deactivated.");
                }

                if (!user.isActive()) {
                        throw new BusinessRuleException(
                                        "Inventory Manager account is already inactive.");
                }

                user.setActive(false);

                userAccountRepository.save(user);
        }

        @Override
        @Transactional
        public void reactivateInventoryManager(Integer id) {
                UserAccount user = userAccountRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User account not found."));

                if (!INVENTORY_MANAGER_ROLE.equals(user.getRole().getName())) {
                        throw new BusinessRuleException(
                                        "Only INVENTORY_MANAGER accounts can be reactivated.");
                }

                if (user.isActive()) {
                        throw new BusinessRuleException(
                                        "Inventory Manager account is already active.");
                }

                user.setActive(true);

                userAccountRepository.save(user);
        }

        private String maskEmail(String email) {
                if (email == null || email.isBlank()) {
                        return "***";
                }
                int atIndex = email.indexOf('@');
                if (atIndex <= 1) {
                        return "***" + email.substring(Math.max(0, atIndex));
                }
                String localPart = email.substring(0, atIndex);
                String domainPart = email.substring(atIndex);
                if (localPart.length() <= 2) {
                        return localPart.charAt(0) + "***" + domainPart;
                }
                return localPart.substring(0, 2) + "***" + domainPart;
        }

        private UserAccountResponse mapToResponse(UserAccount user) {
                return new UserAccountResponse(
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                user.isEmailVerified(),
                                user.isActive(),
                                user.getRole() != null ? user.getRole().getId() : null,
                                user.getRole() != null ? user.getRole().getName() : null);
        }
}