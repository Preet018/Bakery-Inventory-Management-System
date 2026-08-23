package com.bakery.inventory.service;

import com.bakery.inventory.dto.useraccount.*;
import com.bakery.inventory.entity.OtpPurpose;
import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.ResourceNotFoundException;
import com.bakery.inventory.repository.RoleRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAccountServiceImpl implements UserAccountService {
    private static final String ADMIN_ROLE = "ADMIN";
    private static final String CUSTOMER_ROLE = "CUSTOMER";
    private static final String INVENTORY_MANAGER_ROLE = "INVENTORY_MANAGER";

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserAccountResponse> getAllUsers() {
        return userAccountRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public UserAccountResponse getUserById(Integer id) {
        UserAccount user = userAccountRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        )
                );

        return mapToResponse(user);
    }

    @Override
    public UserAccountResponse updateUser(Integer id, UserAccountUpdateRequest request) {
        UserAccount user = userAccountRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        )
                );

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        UserAccount updatedUser = userAccountRepository.save(user);

        return mapToResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteInventoryManager(Integer id) {
        UserAccount user = userAccountRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User account not found."
                                )
                        );

        if (!"INVENTORY_MANAGER".equals(user.getRole().getName())) {
            throw new BusinessRuleException(
                    "Only INVENTORY_MANAGER accounts can be deleted " +
                            "through this operation."
            );
        }

        user.setActive(false);
        user.setEmail(null);

        userAccountRepository.save(user);
    }

    @Override
    @Transactional
    public void deactivateInventoryManager(Integer id) {
        UserAccount user = userAccountRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User account not found."
                                )
                        );

        if (!"INVENTORY_MANAGER".equals(
                user.getRole().getName())) {
            throw new BusinessRuleException(
                    "Only INVENTORY_MANAGER accounts can be deactivated."
            );
        }

        if (!user.isActive()) {
            throw new BusinessRuleException(
                    "Inventory Manager account is already inactive."
            );
        }

        user.setActive(false);

        userAccountRepository.save(user);
    }

    @Override
    @Transactional
    public void reactivateInventoryManager(Integer id) {
        UserAccount user = userAccountRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User account not found."
                                )
                        );

        if (!"INVENTORY_MANAGER".equals(user.getRole().getName())) {
            throw new BusinessRuleException(
                    "Only INVENTORY_MANAGER accounts can be reactivated."
            );
        }

        if (user.getEmail() == null) {
            throw new BusinessRuleException(
                    "This Inventory Manager account has been permanently deleted."
            );
        }

        if (user.isActive()) {
            throw new BusinessRuleException(
                    "Inventory Manager account is already active."
            );
        }

        user.setActive(true);

        userAccountRepository.save(user);
    }

    private UserAccountResponse mapToResponse(UserAccount user) {
        return new UserAccountResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.isEmailVerified(),
                user.isActive(),
                user.getRole().getId()
        );
    }
}