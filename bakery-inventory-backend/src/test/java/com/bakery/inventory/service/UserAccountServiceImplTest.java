package com.bakery.inventory.service;

import com.bakery.inventory.dto.useraccount.UserAccountResponse;
import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.repository.OtpVerificationRepository;
import com.bakery.inventory.repository.RoleRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceImplTest {

        @Mock
        private UserAccountRepository userAccountRepository;

        @Mock
        private RoleRepository roleRepository;

        @Mock
        private OtpVerificationRepository otpVerificationRepository;

        @Mock
        private PasswordEncoder passwordEncoder;

        @Mock
        private OtpService otpService;

        @Mock
        private com.bakery.inventory.security.AdminDeletionSecurityManager adminDeletionSecurityManager;

        @InjectMocks
        private UserAccountServiceImpl userAccountService;

        private UserAccount createAdmin(Integer id, String email) {
                Role role = new Role();
                role.setId(1);
                role.setName("ADMIN");

                UserAccount user = new UserAccount();
                user.setId(id);
                user.setUsername("admin");
                user.setEmail(email);
                user.setRole(role);
                user.setActive(true);
                user.setEmailVerified(true);

                return user;
        }

        private UserAccount createManager(
                        Integer id,
                        boolean active,
                        String email) {
                Role role = new Role();
                role.setId(2);
                role.setName("INVENTORY_MANAGER");

                UserAccount user = new UserAccount();
                user.setId(id);
                user.setUsername("manager");
                user.setEmail(email);
                user.setRole(role);
                user.setActive(active);
                user.setEmailVerified(false);

                return user;
        }

        @Test
        void getInventoryManagers_shouldReturnAllInventoryManagers() {
                UserAccount manager1 = createManager(1, true, "m1@test.com");
                UserAccount manager2 = createManager(2, false, "m2@test.com");

                when(userAccountRepository.findAllByRole_Name("INVENTORY_MANAGER"))
                                .thenReturn(List.of(manager1, manager2));

                List<UserAccountResponse> result = userAccountService.getInventoryManagers();

                assertEquals(2, result.size());
                assertEquals("manager", result.get(0).getUsername());
                assertEquals("INVENTORY_MANAGER", result.get(0).getRole());
                assertTrue(result.get(0).isActive());
                assertFalse(result.get(1).isActive());
        }

        @Test
        void requestDeletionOtp_shouldSendOtpAndReturnMaskedEmailOnValidAdmin() {
                UserAccount admin = createAdmin(10, "admin@bakery.com");
                UserAccount manager = createManager(1, true, "manager@bakery.com");

                when(userAccountRepository.findById(10)).thenReturn(Optional.of(admin));
                when(userAccountRepository.findById(1)).thenReturn(Optional.of(manager));

                var request = new com.bakery.inventory.dto.useraccount.AdminDeletionOtpRequest("admin@bakery.com");
                var response = userAccountService.requestDeletionOtp(10, 1, request);

                assertNotNull(response);
                assertTrue(response.getMaskedEmail().contains("***"));
                verify(otpService).generateAndSendOtp(admin, com.bakery.inventory.entity.OtpPurpose.ADMIN_INVENTORY_MANAGER_DELETION);
                verify(adminDeletionSecurityManager).createPendingOtpSession(10, 1, 5);
        }

        @Test
        void requestDeletionOtp_shouldRejectOnEmailMismatch() {
                UserAccount admin = createAdmin(10, "admin@bakery.com");
                UserAccount manager = createManager(1, true, "manager@bakery.com");

                when(userAccountRepository.findById(10)).thenReturn(Optional.of(admin));
                when(userAccountRepository.findById(1)).thenReturn(Optional.of(manager));

                var request = new com.bakery.inventory.dto.useraccount.AdminDeletionOtpRequest("wrong@bakery.com");

                assertThrows(
                                com.bakery.inventory.exception.BadRequestException.class,
                                () -> userAccountService.requestDeletionOtp(10, 1, request)
                );

                verify(otpService, never()).generateAndSendOtp(any(), any());
        }

        @Test
        void verifyDeletionOtp_shouldVerifyAndReturnTokenOnSuccess() {
                UserAccount admin = createAdmin(10, "admin@bakery.com");

                when(userAccountRepository.findById(10)).thenReturn(Optional.of(admin));
                when(otpService.verifyOtp(admin, com.bakery.inventory.entity.OtpPurpose.ADMIN_INVENTORY_MANAGER_DELETION, "123456"))
                                .thenReturn(true);
                when(adminDeletionSecurityManager.createFinalAuthSession(10, 1, 5))
                                .thenReturn("valid-token-123");

                var request = new com.bakery.inventory.dto.useraccount.AdminDeletionVerifyRequest("123456");
                var response = userAccountService.verifyDeletionOtp(10, 1, request);

                assertEquals("valid-token-123", response.getVerificationToken());
                verify(adminDeletionSecurityManager).validatePendingOtpSession(10, 1);
                verify(adminDeletionSecurityManager).removePendingOtpSession(10);
                verify(adminDeletionSecurityManager).createFinalAuthSession(10, 1, 5);
        }

        @Test
        void verifyDeletionOtp_shouldRejectOnInvalidOtp() {
                UserAccount admin = createAdmin(10, "admin@bakery.com");

                when(userAccountRepository.findById(10)).thenReturn(Optional.of(admin));
                when(otpService.verifyOtp(admin, com.bakery.inventory.entity.OtpPurpose.ADMIN_INVENTORY_MANAGER_DELETION, "000000"))
                                .thenReturn(false);

                var request = new com.bakery.inventory.dto.useraccount.AdminDeletionVerifyRequest("000000");

                assertThrows(
                                com.bakery.inventory.exception.BadRequestException.class,
                                () -> userAccountService.verifyDeletionOtp(10, 1, request)
                );

                verify(adminDeletionSecurityManager, never()).createFinalAuthSession(any(), any(), anyInt());
        }

        @Test
        void confirmDeleteInventoryManager_shouldConsumeTokenAndPermanentlyDelete() {
                UserAccount manager = createManager(1, true, "manager@test.com");

                when(userAccountRepository.findById(1)).thenReturn(Optional.of(manager));

                var request = new com.bakery.inventory.dto.useraccount.AdminDeletionConfirmRequest("valid-token-123");
                userAccountService.confirmDeleteInventoryManager(10, 1, request);

                verify(adminDeletionSecurityManager).consumeFinalAuthSession(10, 1, "valid-token-123");
                verify(otpVerificationRepository).deleteByUserAccountId(1);
                verify(userAccountRepository).delete(manager);
                verify(userAccountRepository).flush();
        }

        @Test
        void deactivateInventoryManager_shouldDeactivateActiveManager() {
                UserAccount manager = createManager(
                                1,
                                true,
                                "manager@test.com");

                when(userAccountRepository.findById(1))
                                .thenReturn(Optional.of(manager));

                when(userAccountRepository.save(manager))
                                .thenReturn(manager);

                userAccountService.deactivateInventoryManager(1);

                assertFalse(manager.isActive());
                assertEquals("manager@test.com", manager.getEmail());

                verify(userAccountRepository)
                                .save(manager);
        }

        @Test
        void deactivateInventoryManager_shouldRejectAlreadyInactiveManager() {
                UserAccount manager = createManager(
                                1,
                                false,
                                "manager@test.com");

                when(userAccountRepository.findById(1))
                                .thenReturn(Optional.of(manager));

                BusinessRuleException exception = assertThrows(
                                BusinessRuleException.class,
                                () -> userAccountService
                                                .deactivateInventoryManager(1));

                assertEquals(
                                "Inventory Manager account is already inactive.",
                                exception.getMessage());

                verify(userAccountRepository, never())
                                .save(any(UserAccount.class));
        }

        @Test
        void reactivateInventoryManager_shouldReactivateInactiveManager() {
                UserAccount manager = createManager(
                                1,
                                false,
                                "manager@test.com");

                when(userAccountRepository.findById(1))
                                .thenReturn(Optional.of(manager));

                when(userAccountRepository.save(manager))
                                .thenReturn(manager);

                userAccountService.reactivateInventoryManager(1);

                assertTrue(manager.isActive());
                assertEquals("manager@test.com", manager.getEmail());

                verify(userAccountRepository)
                                .save(manager);
        }

        @Test
        void reactivateInventoryManager_shouldRejectAlreadyActiveManager() {
                UserAccount manager = createManager(
                                1,
                                true,
                                "manager@test.com");

                when(userAccountRepository.findById(1))
                                .thenReturn(Optional.of(manager));

                BusinessRuleException exception = assertThrows(
                                BusinessRuleException.class,
                                () -> userAccountService
                                                .reactivateInventoryManager(1));

                assertEquals(
                                "Inventory Manager account is already active.",
                                exception.getMessage());

                verify(userAccountRepository, never())
                                .save(any(UserAccount.class));
        }
}