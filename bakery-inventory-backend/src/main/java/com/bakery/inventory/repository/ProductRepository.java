package com.bakery.inventory.repository;

import com.bakery.inventory.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Integer> {
}