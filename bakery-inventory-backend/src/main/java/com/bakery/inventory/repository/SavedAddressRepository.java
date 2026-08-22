package com.bakery.inventory.repository;

import com.bakery.inventory.entity.SavedAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedAddressRepository extends JpaRepository<SavedAddress, Integer> {
    List<SavedAddress> findByUserId(Integer userId);

    Optional<SavedAddress> findByIdAndUserId(Integer id, Integer userId);

    List<SavedAddress> findByUserIdAndIsDefaultTrue(Integer userId);

    boolean existsByUserId(Integer userId);
}