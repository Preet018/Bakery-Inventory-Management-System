package com.bakery.inventory.controller;

import com.bakery.inventory.dto.product.ProductCreateRequest;
import com.bakery.inventory.dto.product.ProductResponse;
import com.bakery.inventory.dto.product.ProductUpdateRequest;
import com.bakery.inventory.dto.productimage.ProductImageRequest;
import com.bakery.inventory.dto.productimage.ProductImageResponse;
import com.bakery.inventory.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.createProduct(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(
                productService.getAllProducts()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Integer id) {
        return ResponseEntity.ok(
                productService.getProductById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Integer id, @RequestBody ProductUpdateRequest request) {
        return ResponseEntity.ok(
                productService.updateProduct(id, request)
        );
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ProductResponse> deactivateProduct(@PathVariable Integer id) {
        return ResponseEntity.ok(
                productService.deactivateProduct(id)
        );
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ProductResponse> activateProduct(@PathVariable Integer id) {
        return ResponseEntity.ok(
                productService.activateProduct(id)
        );
    }

    @PostMapping("/{productId}/images")
    public ResponseEntity<List<ProductImageResponse>> addProductImage(@PathVariable Integer productId, @RequestBody ProductImageRequest request) {
        List<ProductImageResponse> responses = productService.addProductImages(productId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(responses);
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    public ResponseEntity<Void> removeProductImage(@PathVariable Integer productId, @PathVariable Integer imageId) {
        productService.removeProductImage(productId, imageId);

        return ResponseEntity.noContent().build();
    }
}