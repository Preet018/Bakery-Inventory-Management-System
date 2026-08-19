package com.bakery.inventory.service;

import com.bakery.inventory.dto.product.ProductCreateRequest;
import com.bakery.inventory.dto.product.ProductResponse;
import com.bakery.inventory.dto.product.ProductUpdateRequest;
import com.bakery.inventory.dto.productimage.ProductImageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ProductService {
    ProductResponse createProduct(ProductCreateRequest request, List<MultipartFile> images) throws IOException;

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Integer id);

    ProductResponse updateProduct(Integer id, ProductUpdateRequest request);

    ProductResponse deactivateProduct(Integer id);

    ProductResponse activateProduct(Integer id);

    List<ProductImageResponse> addProductImages(Integer productId, List<MultipartFile> images) throws IOException;

    void removeProductImage(Integer productId, Integer imageId) throws IOException;
}