package com.bakery.inventory.service;

import com.bakery.inventory.dto.product.ProductCreateRequest;
import com.bakery.inventory.dto.product.ProductResponse;
import com.bakery.inventory.dto.product.ProductUpdateRequest;
import com.bakery.inventory.dto.productimage.ProductImageResponse;
import com.bakery.inventory.entity.*;
import com.bakery.inventory.exception.BadRequestException;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.exception.ResourceNotFoundException;
import com.bakery.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ImageStorageService imageStorageService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductResponse createProduct(ProductCreateRequest request, List<MultipartFile> images) throws IOException {
        validateImagesPresent(images);

        Category category = categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Category not found with id: "
                                                + request.getCategoryId()
                                )
                        );

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Supplier not found with id: "
                                                + request.getSupplierId()
                                )
                        );

        if (!Boolean.TRUE.equals(supplier.getIsActive())) {
            throw new BusinessRuleException(
                    "Cannot create product with inactive supplier"
            );
        }

        Product product = new Product();

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(category);
        product.setSupplier(supplier);

        product.setIsActive(true);

        Product savedProduct = productRepository.save(product);

        Inventory inventory = new Inventory();

        inventory.setProduct(savedProduct);
        inventory.setQuantity(0);
        inventory.setMinimumStock(0);

        inventoryRepository.save(inventory);

        List<String> storedImagePaths = new ArrayList<>();

        try {
            for (MultipartFile image : images) {
                String imagePath = imageStorageService.storeImage(image);

                storedImagePaths.add(imagePath);

                ProductImage productImage = new ProductImage();

                productImage.setProduct(savedProduct);
                productImage.setImagePath(imagePath);
                productImage.setIsActive(true);

                productImageRepository.save(productImage);
            }

            return mapToResponse(savedProduct);
        } catch (IOException | RuntimeException exception) {
            cleanupStoredImages(storedImagePaths);
            throw exception;
        }
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ProductResponse getProductById(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + id
                        )
                );

        return mapToResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Integer id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + id
                        )
                );

        Category category = categoryRepository.findById(
                        request.getCategoryId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found with id: "
                                        + request.getCategoryId()
                        )
                );

        Integer currentSupplierId = product.getSupplier().getId();
        Integer requestedSupplierId = request.getSupplierId();

        if (!currentSupplierId.equals(requestedSupplierId)) {
            Supplier newSupplier = supplierRepository.findById(requestedSupplierId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Supplier not found with id: "
                                            + requestedSupplierId
                            )
                    );

            if (!Boolean.TRUE.equals(newSupplier.getIsActive())) {
                throw new BusinessRuleException(
                        "Cannot change product to an inactive supplier"
                );
            }

            product.setSupplier(newSupplier);
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(category);

        Product updatedProduct = productRepository.save(product);

        return mapToResponse(updatedProduct);
    }

    @Override
    @Transactional
    public ProductResponse deactivateProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + id
                        )
                );

        product.setIsActive(false);

        List<ProductImage> images = productImageRepository.findByProductId(id);

        for (ProductImage image : images) {
            image.setIsActive(false);
        }

        productImageRepository.saveAll(images);

        Product updatedProduct = productRepository.save(product);

        return mapToResponse(updatedProduct);
    }

    @Override
    @Transactional
    public ProductResponse activateProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + id
                        )
                );

        product.setIsActive(true);

        List<ProductImage> images = productImageRepository.findByProductId(id);

        for (ProductImage image : images) {
            image.setIsActive(true);
        }

        productImageRepository.saveAll(images);

        Product updatedProduct = productRepository.save(product);

        return mapToResponse(updatedProduct);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<ProductImageResponse> addProductImages(Integer productId, List<MultipartFile> images) throws IOException {
        Product product = productRepository.findById(productId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Product not found with id: " + productId
                                )
                        );

        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new BusinessRuleException(
                    "Cannot upload images for an inactive product"
            );
        }

        validateImagesPresent(images);

        List<ProductImageResponse> responses = new ArrayList<>();

        List<String> storedImagePaths = new ArrayList<>();

        try {
            for (MultipartFile image : images) {
                String imagePath = imageStorageService.storeImage(image);

                storedImagePaths.add(imagePath);

                ProductImage productImage = new ProductImage();

                productImage.setProduct(product);
                productImage.setImagePath(imagePath);
                productImage.setIsActive(true);

                ProductImage savedImage = productImageRepository.save(productImage);

                responses.add(mapToImageResponse(savedImage));
            }

            return responses;
        } catch (IOException | RuntimeException exception) {
            cleanupStoredImages(storedImagePaths);
            throw exception;
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeProductImage(Integer productId, Integer imageId) throws IOException {
        Product product = productRepository.findById(productId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Product not found with id: "
                                                + productId
                                )
                        );

        ProductImage productImage = productImageRepository.findById(imageId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Product image not found with id: "
                                                + imageId
                                )
                        );

        if (!productImage.getProduct().getId().equals(product.getId())) {
            throw new BusinessRuleException(
                    "Product image does not belong to product: "
                            + productId
            );
        }

        List<ProductImage> productImages = productImageRepository.findByProductId(productId);

        if (productImages.size() == 1) {
            throw new BusinessRuleException(
                    "Cannot delete the only image of a product"
            );
        }

        String imagePath = productImage.getImagePath();

        productImageRepository.delete(productImage);

        productImageRepository.flush();

        imageStorageService.deleteImage(imagePath);
    }

    private ProductResponse mapToResponse(Product product) {
        List<ProductImageResponse> images = productImageRepository
                        .findByProductIdAndIsActiveTrue(
                                product.getId()
                        )
                        .stream()
                        .map(this::mapToImageResponse)
                        .toList();

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getCategory().getId(),
                product.getSupplier().getId(),
                product.getIsActive(),
                images
        );
    }

    private void cleanupStoredImages(List<String> imagePaths) {
        for (String imagePath : imagePaths) {
            try {
                imageStorageService.deleteImage(imagePath);
            } catch (IOException | RuntimeException cleanupException) {
                log.error("Failed to clean up stored product image: {}", imagePath, cleanupException);
            }
        }
    }

    private ProductImageResponse mapToImageResponse(ProductImage productImage) {
        return new ProductImageResponse(
                productImage.getId(),
                productImage.getProduct().getId(),
                productImage.getImagePath(),
                productImage.getIsActive()
        );
    }

    private void validateImagesPresent(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            throw new BadRequestException(
                    "At least one product image is required"
            );
        }
    }
}