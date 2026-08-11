package com.bakery.inventory.dto.supplier;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierResponse {

    private Integer id;
    private String name;
    private String email;
    private String phone;
    private String address;
}