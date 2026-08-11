package com.bakery.inventory.dto.productimage;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageResponse {

    private Integer id;
    private Integer productId;
    private String imagePath;
    private Boolean active;
}