package com.bakery.inventory.service;

import com.bakery.inventory.dto.useraccount.*;

import java.util.List;

public interface UserAccountService {
    List<UserAccountResponse> getAllUsers();

    UserAccountResponse getUserById(Integer id);

    UserAccountResponse updateUser(Integer id, UserAccountUpdateRequest request);

    void deleteInventoryManager(Integer id);

    void deactivateInventoryManager(Integer id);

    void reactivateInventoryManager(Integer id);
}