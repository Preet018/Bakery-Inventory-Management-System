package com.bakery.inventory.service;

import com.bakery.inventory.dto.useraccount.*;

import java.util.List;

public interface UserAccountService {
    List<UserAccountResponse> getAllUsers();

    List<UserAccountResponse> getInventoryManagers();

    UserAccountResponse getUserById(Integer id);

    UserAccountResponse updateUser(Integer id, UserAccountUpdateRequest request);

    AdminDeletionOtpResponse requestDeletionOtp(Integer adminUserId, Integer targetManagerId, AdminDeletionOtpRequest request);

    AdminDeletionVerifyResponse verifyDeletionOtp(Integer adminUserId, Integer targetManagerId, AdminDeletionVerifyRequest request);

    void confirmDeleteInventoryManager(Integer adminUserId, Integer targetManagerId, AdminDeletionConfirmRequest request);

    void deactivateInventoryManager(Integer id);

    void reactivateInventoryManager(Integer id);
}