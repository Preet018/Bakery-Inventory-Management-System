package com.bakery.inventory.service;

import com.bakery.inventory.dto.productimage.ProductImageRequest;
import com.bakery.inventory.dto.productimage.ProductImageResponse;

import java.util.List;

public interface ProductImageService {

    ProductImageResponse addImage(ProductImageRequest request);

    List<ProductImageResponse> getImagesByProductId(Integer productId);

    ProductImageResponse getImageById(Integer id);

    ProductImageResponse updateImage(Integer id, ProductImageRequest request);

    ProductImageResponse deactivateImage(Integer id);
}