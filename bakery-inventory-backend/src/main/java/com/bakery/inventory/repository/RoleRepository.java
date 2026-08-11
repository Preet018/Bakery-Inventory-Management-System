package com.bakery.inventory.repository;

import com.bakery.inventory.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Integer> {
}