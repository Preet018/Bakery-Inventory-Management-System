package com.bakery.inventory.service;

import com.bakery.inventory.dto.savedaddress.*;
import com.bakery.inventory.entity.SavedAddress;
import com.bakery.inventory.entity.UserAccount;
import com.bakery.inventory.exception.ResourceNotFoundException;
import com.bakery.inventory.repository.SavedAddressRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedAddressServiceImpl implements SavedAddressService {
    private final SavedAddressRepository savedAddressRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional
    public SavedAddressResponse createAddress(Integer userId, SavedAddressCreateRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        SavedAddress address = new SavedAddress();

        address.setUser(user);
        address.setLabel(request.getLabel());
        address.setAddressLine(request.getAddressLine());
        address.setLandmark(request.getLandmark());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setPlaceId(request.getPlaceId());

        boolean firstAddress = !savedAddressRepository.existsByUserId(userId);

        boolean makeDefault = firstAddress || Boolean.TRUE.equals(request.getIsDefault());

        if (makeDefault) {
            clearDefaultAddress(userId);
        }

        address.setIsDefault(makeDefault);

        SavedAddress savedAddress = savedAddressRepository.save(address);

        return mapToResponse(savedAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SavedAddressResponse> getUserAddresses(Integer userId) {
        userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        return savedAddressRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SavedAddressResponse getAddress(Integer userId, Integer addressId) {
        SavedAddress address = savedAddressRepository
                .findByIdAndUserId(addressId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Saved address not found with id: " + addressId
                        )
                );

        return mapToResponse(address);
    }

    @Override
    @Transactional
    public SavedAddressResponse updateAddress(Integer userId, Integer addressId, SavedAddressUpdateRequest request) {
        SavedAddress address = savedAddressRepository
                .findByIdAndUserId(addressId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Saved address not found with id: " + addressId
                        )
                );

        address.setLabel(request.getLabel());
        address.setAddressLine(request.getAddressLine());
        address.setLandmark(request.getLandmark());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setPlaceId(request.getPlaceId());

        SavedAddress updatedAddress = savedAddressRepository.save(address);

        return mapToResponse(address);
    }

    @Override
    @Transactional
    public void deleteAddress(Integer userId, Integer addressId) {
        SavedAddress address = savedAddressRepository
                .findByIdAndUserId(addressId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Saved address not found with id: " + addressId
                        )
                );

        savedAddressRepository.delete(address);
    }

    @Override
    @Transactional
    public SavedAddressResponse setDefaultAddress(Integer userId, Integer addressId) {
        SavedAddress address = savedAddressRepository
                .findByIdAndUserId(addressId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Saved address not found with id: " + addressId
                        )
                );

        clearDefaultAddress(userId);

        address.setIsDefault(true);

        SavedAddress updatedAddress = savedAddressRepository.save(address);

        return mapToResponse(address);
    }

    private void clearDefaultAddress(Integer userId) {
        List<SavedAddress> defaultAddresses = savedAddressRepository.findByUserIdAndIsDefaultTrue(userId);

        defaultAddresses.forEach(address -> address.setIsDefault(false));
    }

    private SavedAddressResponse mapToResponse(SavedAddress address) {
        SavedAddressResponse response = new SavedAddressResponse();

        response.setId(address.getId());
        response.setLabel(address.getLabel());
        response.setAddressLine(address.getAddressLine());
        response.setLandmark(address.getLandmark());
        response.setCity(address.getCity());
        response.setState(address.getState());
        response.setPostalCode(address.getPostalCode());
        response.setLatitude(address.getLatitude());
        response.setLongitude(address.getLongitude());
        response.setPlaceId(address.getPlaceId());
        response.setIsDefault(address.getIsDefault());

        return response;
    }
}