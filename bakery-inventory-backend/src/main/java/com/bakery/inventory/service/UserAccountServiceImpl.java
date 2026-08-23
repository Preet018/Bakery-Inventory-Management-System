package com.bakery.inventory.service;

import com.bakery.inventory.dto.useraccount.*;
import com.bakery.inventory.entity.Role;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.ResourceNotFoundException;
import com.bakery.inventory.repository.RoleRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAccountServiceImpl implements UserAccountService {
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserAccountResponse createUser(UserAccountCreateRequest request) {
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found with id: " + request.getRoleId()
                        )
                );

        UserAccount user = new UserAccount();

        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        user.setEmail(request.getEmail());
        user.setRole(role);

        UserAccount savedUser = userAccountRepository.save(user);

        return mapToResponse(savedUser);
    }

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
    public void deleteUser(Integer id) {
        UserAccount user = userAccountRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        )
                );

        user.setActive(false);
        user.setEmail(null);

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