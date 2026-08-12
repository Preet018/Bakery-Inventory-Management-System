package com.bakery.inventory.service;

import com.bakery.inventory.dto.category.CategoryRequest;
import com.bakery.inventory.dto.category.CategoryResponse;
import com.bakery.inventory.entity.Category;
import com.bakery.inventory.repository.CategoryRepository;
import com.bakery.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    // NEW
    private final ProductRepository productRepository;

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {

        Category category = new Category();
        category.setName(request.getName());

        Category savedCategory = categoryRepository.save(category);

        return new CategoryResponse(
                savedCategory.getId(),
                savedCategory.getName());
    }

    @Override
    public List<CategoryResponse> getAllCategories() {

        return categoryRepository.findAll()
                .stream()
                .map(category -> new CategoryResponse(
                        category.getId(),
                        category.getName()))
                .toList();
    }

    @Override
    public CategoryResponse getCategoryById(Integer id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: " + id));

        return new CategoryResponse(
                category.getId(),
                category.getName());
    }

    @Override
    public CategoryResponse updateCategory(Integer id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: " + id));

        category.setName(request.getName());

        Category updatedCategory = categoryRepository.save(category);

        return new CategoryResponse(
                updatedCategory.getId(),
                updatedCategory.getName());
    }

    @Override
    public void deleteCategory(Integer id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: " + id));

        if (productRepository.existsByCategoryId(id)) {
            throw new RuntimeException(
                    "Category cannot be deleted because products are associated with it");
        }

        categoryRepository.delete(category);
    }
}