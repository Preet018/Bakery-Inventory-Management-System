package com.bakery.inventory.service;

import com.bakery.inventory.dto.savedaddress.SavedAddressRequest;
import com.bakery.inventory.dto.savedaddress.SavedAddressResponse;

import java.util.List;

public interface SavedAddressService {
    SavedAddressResponse createAddress(Integer userId, SavedAddressRequest request);

    List<SavedAddressResponse> getUserAddresses(Integer userId);

    SavedAddressResponse getAddress(Integer userId, Integer addressId);

    SavedAddressResponse updateAddress(Integer userId, Integer addressId, SavedAddressRequest request);

    void deleteAddress(Integer userId, Integer addressId);

    SavedAddressResponse setDefaultAddress(Integer userId, Integer addressId);
}