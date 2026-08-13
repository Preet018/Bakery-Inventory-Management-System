package com.bakery.inventory.service;

import com.bakery.inventory.dto.product.ProductRequest;
import com.bakery.inventory.dto.product.ProductResponse;
import com.bakery.inventory.entity.Category;
import com.bakery.inventory.entity.Inventory;
import com.bakery.inventory.entity.Product;
import com.bakery.inventory.entity.Supplier;
import com.bakery.inventory.repository.CategoryRepository;
import com.bakery.inventory.repository.InventoryRepository;
import com.bakery.inventory.repository.ProductRepository;
import com.bakery.inventory.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(
                        request.getCategoryId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: "
                                        + request.getCategoryId()
                        )
                );

        Supplier supplier = supplierRepository.findById(
                        request.getSupplierId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Supplier not found with id: "
                                        + request.getSupplierId()
                        )
                );

        if (!Boolean.TRUE.equals(supplier.getIsActive())) {
            throw new RuntimeException(
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

        return mapToResponse(savedProduct);
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
                        new RuntimeException(
                                "Product not found with id: " + id
                        )
                );

        return mapToResponse(product);
    }

    @Override
    public ProductResponse updateProduct(Integer id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: " + id
                        )
                );

        Category category = categoryRepository.findById(
                        request.getCategoryId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: "
                                        + request.getCategoryId()
                        )
                );

        if (request.getSupplierId() != null) {
            Integer currentSupplierId = product.getSupplier().getId();
            Integer requestedSupplierId = request.getSupplierId();

            if (!currentSupplierId.equals(requestedSupplierId)) {
                Supplier newSupplier = supplierRepository.findById(
                            requestedSupplierId
                        )
                        .orElseThrow(() ->
                        new RuntimeException(
                                "Supplier not found with id: "
                                        + requestedSupplierId
                        )
                    );

                if (!Boolean.TRUE.equals(newSupplier.getIsActive())) {
                    throw new RuntimeException(
                            "Cannot change product to an inactive supplier"
                    );
                }

                product.setSupplier(newSupplier);
            }
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(category);

        Product updatedProduct = productRepository.save(product);

        return mapToResponse(updatedProduct);
    }

    @Override
    public ProductResponse deactivateProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: " + id
                        )
                );

        product.setIsActive(false);

        Product updatedProduct = productRepository.save(product);

        return mapToResponse(updatedProduct);
    }

    @Override
    public ProductResponse activateProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: " + id
                        )
                );

        product.setIsActive(true);

        Product updatedProduct = productRepository.save(product);

        return mapToResponse(updatedProduct);
    }

    private ProductResponse mapToResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getCategory().getId(),
                product.getSupplier().getId(),
                product.getIsActive()
        );
    }
}