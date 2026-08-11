package com.bakery.inventory.service;

import com.bakery.inventory.dto.useraccount.UserAccountRequest;
import com.bakery.inventory.dto.useraccount.UserAccountResponse;

import java.util.List;

public interface UserAccountService {

    UserAccountResponse createUser(UserAccountRequest request);

    List<UserAccountResponse> getAllUsers();

    UserAccountResponse getUserById(Integer id);

    UserAccountResponse updateUser(Integer id, UserAccountRequest request);

    void deleteUser(Integer id);
}