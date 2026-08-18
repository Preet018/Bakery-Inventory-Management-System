package com.bakery.inventory.dto.productimage;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageRequest {
    private List<String> imagePaths;
}