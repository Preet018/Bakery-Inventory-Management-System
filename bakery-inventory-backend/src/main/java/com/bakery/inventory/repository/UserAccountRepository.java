package com.bakery.inventory.repository;

import com.bakery.inventory.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Integer> {
}