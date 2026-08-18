package com.bakery.inventory.repository;

import com.bakery.inventory.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
    List<ProductImage> findByProductId(Integer productId);

    List<ProductImage> findByProductIdAndIsActiveTrue(Integer productId);

    boolean existsByProductIdAndImagePath(Integer productId, String imagePath);
}