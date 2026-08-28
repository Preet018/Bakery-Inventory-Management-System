package com.bakery.inventory.controller;

import com.bakery.inventory.dto.savedaddress.SavedAddressCreateRequest;
import com.bakery.inventory.dto.savedaddress.SavedAddressResponse;
import com.bakery.inventory.dto.savedaddress.SavedAddressUpdateRequest;
import com.bakery.inventory.security.CustomUserDetails;
import com.bakery.inventory.service.SavedAddressService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@Validated
public class SavedAddressController {
    private final SavedAddressService savedAddressService;

    @GetMapping
    public ResponseEntity<List<SavedAddressResponse>> getUserAddresses(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(
                savedAddressService.getUserAddresses(userDetails.getUserId())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedAddressResponse> getAddress(
            Authentication authentication,
            @Positive(message = "Address ID must be positive") @PathVariable Integer id) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(
                savedAddressService.getAddress(userDetails.getUserId(), id)
        );
    }

    @PostMapping
    public ResponseEntity<SavedAddressResponse> createAddress(
            Authentication authentication,
            @Valid @RequestBody SavedAddressCreateRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        SavedAddressResponse response = savedAddressService.createAddress(userDetails.getUserId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedAddressResponse> updateAddress(
            Authentication authentication,
            @Positive(message = "Address ID must be positive") @PathVariable Integer id,
            @Valid @RequestBody SavedAddressUpdateRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(
                savedAddressService.updateAddress(userDetails.getUserId(), id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(
            Authentication authentication,
            @Positive(message = "Address ID must be positive") @PathVariable Integer id) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        savedAddressService.deleteAddress(userDetails.getUserId(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<SavedAddressResponse> setDefaultAddress(
            Authentication authentication,
            @Positive(message = "Address ID must be positive") @PathVariable Integer id) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(
                savedAddressService.setDefaultAddress(userDetails.getUserId(), id)
        );
    }
}
