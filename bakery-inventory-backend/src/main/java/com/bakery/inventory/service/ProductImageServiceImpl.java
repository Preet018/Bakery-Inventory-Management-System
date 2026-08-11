package com.bakery.inventory.service;

import com.bakery.inventory.dto.productimage.ProductImageRequest;
import com.bakery.inventory.dto.productimage.ProductImageResponse;
import com.bakery.inventory.entity.Product;
import com.bakery.inventory.entity.ProductImage;
import com.bakery.inventory.repository.ProductImageRepository;
import com.bakery.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductImageServiceImpl implements ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;

    @Override
    public ProductImageResponse addImage(ProductImageRequest request) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: "
                                        + request.getProductId()
                        )
                );

        ProductImage productImage = new ProductImage();

        productImage.setProduct(product);
        productImage.setImagePath(request.getImagePath());
        productImage.setIsActive(true);

        ProductImage savedImage =
                productImageRepository.save(productImage);

        return mapToResponse(savedImage);
    }

    @Override
    public List<ProductImageResponse> getImagesByProductId(Integer productId) {
        productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: " + productId
                        )
                );

        return productImageRepository.findByProductId(productId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ProductImageResponse getImageById(Integer id) {

        ProductImage productImage =
                productImageRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product image not found with id: "
                                                + id
                                )
                        );

        return mapToResponse(productImage);
    }

    @Override
    public ProductImageResponse updateImage(
            Integer id,
            ProductImageRequest request
    ) {

        ProductImage productImage =
                productImageRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product image not found with id: "
                                                + id
                                )
                        );

        Product product = productRepository.findById(
                        request.getProductId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: "
                                        + request.getProductId()
                        )
                );

        productImage.setProduct(product);
        productImage.setImagePath(request.getImagePath());

        ProductImage updatedImage =
                productImageRepository.save(productImage);

        return mapToResponse(updatedImage);
    }

    @Override
    public ProductImageResponse deactivateImage(Integer id) {

        ProductImage productImage =
                productImageRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product image not found with id: "
                                                + id
                                )
                        );

        productImage.setIsActive(false);

        ProductImage updatedImage =
                productImageRepository.save(productImage);

        return mapToResponse(updatedImage);
    }

    private ProductImageResponse mapToResponse(
            ProductImage productImage
    ) {

        return new ProductImageResponse(
                productImage.getId(),
                productImage.getProduct().getId(),
                productImage.getImagePath(),
                productImage.getIsActive()
        );
    }
}