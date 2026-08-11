package com.bakery.inventory.dto.productimage;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageRequest {

    private Integer productId;
    private String imagePath;
}