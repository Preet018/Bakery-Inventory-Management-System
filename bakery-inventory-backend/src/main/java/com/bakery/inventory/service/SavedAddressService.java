package com.bakery.inventory.service;

import com.bakery.inventory.dto.savedaddress.SavedAddressCreateRequest;
import com.bakery.inventory.dto.savedaddress.SavedAddressResponse;
import com.bakery.inventory.dto.savedaddress.SavedAddressUpdateRequest;

import java.util.List;

public interface SavedAddressService {
    SavedAddressResponse createAddress(Integer userId, SavedAddressCreateRequest request);

    List<SavedAddressResponse> getUserAddresses(Integer userId);

    SavedAddressResponse getAddress(Integer userId, Integer addressId);

    SavedAddressResponse updateAddress(Integer userId, Integer addressId, SavedAddressUpdateRequest request);

    void deleteAddress(Integer userId, Integer addressId);

    SavedAddressResponse setDefaultAddress(Integer userId, Integer addressId);
}