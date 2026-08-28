package com.bakery.inventory.dto.product;

import com.bakery.inventory.dto.productimage.ProductImageResponse;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Integer id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer categoryId;
    private Integer supplierId;
    private Boolean isActive;
    private List<ProductImageResponse> images;
    // CHANGE: Added availableQuantity to provide stock availability for cart and catalog (Issue #07)
    private Integer availableQuantity;
}