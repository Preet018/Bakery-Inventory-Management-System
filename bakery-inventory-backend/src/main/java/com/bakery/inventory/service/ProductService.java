package com.bakery.inventory.service;

import com.bakery.inventory.dto.product.ProductCreateRequest;
import com.bakery.inventory.dto.product.ProductResponse;
import com.bakery.inventory.dto.product.ProductUpdateRequest;
import com.bakery.inventory.dto.productimage.ProductImageRequest;
import com.bakery.inventory.dto.productimage.ProductImageResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductCreateRequest request);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Integer id);

    ProductResponse updateProduct(Integer id, ProductUpdateRequest request);

    ProductResponse deactivateProduct(Integer id);

    ProductResponse activateProduct(Integer id);

    List<ProductImageResponse> addProductImages(Integer productId, ProductImageRequest request);

    void removeProductImage(Integer productId, Integer imageId);
}