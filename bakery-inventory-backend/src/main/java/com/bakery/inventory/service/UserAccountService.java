package com.bakery.inventory.service;

import com.bakery.inventory.dto.useraccount.*;

import java.util.List;

public interface UserAccountService {
    List<UserAccountResponse> getAllUsers();

    UserAccountResponse getUserById(Integer id);

    UserAccountResponse updateUser(Integer id, UserAccountUpdateRequest request);

    void deleteUser(Integer id);
}