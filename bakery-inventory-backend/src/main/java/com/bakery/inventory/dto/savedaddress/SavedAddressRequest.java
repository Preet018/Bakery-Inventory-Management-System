package com.bakery.inventory.dto.savedaddress;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class SavedAddressRequest {
    private String label;

    private String addressLine;

    private String landmark;

    private String city;

    private String state;

    private String postalCode;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String placeId;

    private Boolean isDefault;
}