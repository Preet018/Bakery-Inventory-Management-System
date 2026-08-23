package com.bakery.inventory.service;

import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.repository.RoleRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserAccountServiceImpl userAccountService;

    private UserAccount createManager(
            Integer id,
            boolean active,
            String email
    ) {
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
    void deactivateInventoryManager_shouldDeactivateActiveManager() {
        UserAccount manager =
                createManager(
                        1,
                        true,
                        "manager@test.com"
                );

        when(userAccountRepository.findById(1))
                .thenReturn(Optional.of(manager));

        when(userAccountRepository.save(manager))
                .thenReturn(manager);

        userAccountService.deactivateInventoryManager(1);

        assertFalse(manager.isActive());

        verify(userAccountRepository)
                .save(manager);
    }

    @Test
    void deactivateInventoryManager_shouldRejectAlreadyInactiveManager() {
        UserAccount manager =
                createManager(
                        1,
                        false,
                        "manager@test.com"
                );

        when(userAccountRepository.findById(1))
                .thenReturn(Optional.of(manager));

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () -> userAccountService
                                .deactivateInventoryManager(1)
                );

        assertEquals(
                "Inventory Manager account is already inactive.",
                exception.getMessage()
        );

        verify(userAccountRepository, never())
                .save(any(UserAccount.class));
    }

    @Test
    void reactivateInventoryManager_shouldRejectPermanentlyDeletedAccount() {
        UserAccount manager =
                createManager(
                        1,
                        false,
                        null
                );

        when(userAccountRepository.findById(1))
                .thenReturn(Optional.of(manager));

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () -> userAccountService
                                .reactivateInventoryManager(1)
                );

        assertEquals(
                "This Inventory Manager account has been permanently deleted.",
                exception.getMessage()
        );

        verify(userAccountRepository, never())
                .save(any(UserAccount.class));
    }
}