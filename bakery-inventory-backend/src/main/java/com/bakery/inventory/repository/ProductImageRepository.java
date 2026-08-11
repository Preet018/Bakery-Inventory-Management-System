package com.bakery.inventory.repository;

import com.bakery.inventory.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
}