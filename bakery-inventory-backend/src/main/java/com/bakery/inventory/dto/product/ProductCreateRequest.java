package com.bakery.inventory.dto.product;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreateRequest {
    private String name;
    private String description;
    private BigDecimal price;
    private Integer categoryId;
    private Integer supplierId;
}