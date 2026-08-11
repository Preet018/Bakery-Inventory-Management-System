package com.bakery.inventory.service;

import com.bakery.inventory.dto.product.ProductRequest;
import com.bakery.inventory.dto.product.ProductResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Integer id);

    ProductResponse updateProduct(Integer id, ProductRequest request);

    ProductResponse deactivateProduct(Integer id);
}