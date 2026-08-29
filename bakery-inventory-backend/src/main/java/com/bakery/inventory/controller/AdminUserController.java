package com.bakery.inventory.controller;

import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;
import com.bakery.inventory.dto.useraccount.UserAccountResponse;
import com.bakery.inventory.service.AuthService;
import com.bakery.inventory.service.UserAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Validated
public class AdminUserController {
    private final AuthService authService;
    private final UserAccountService userAccountService;

    @GetMapping("/inventory-managers")
    public ResponseEntity<List<UserAccountResponse>> getInventoryManagers() {
        return ResponseEntity.ok(userAccountService.getInventoryManagers());
    }

    @PostMapping("/inventory-managers")
    public ResponseEntity<String> registerInventoryManager(@Valid @RequestBody AccountRegistrationRequest request) {
        authService.registerInventoryManager(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        "Inventory Manager registered successfully. "
                                + "Please verify the registered email before logging in."
                );
    }

    @PatchMapping("/inventory-managers/{id}/deactivate")
    public ResponseEntity<String> deactivateInventoryManager(@PathVariable Integer id) {
        userAccountService.deactivateInventoryManager(id);

        return ResponseEntity.ok(
                "Inventory Manager account deactivated successfully."
        );
    }

    @PatchMapping("/inventory-managers/{id}/reactivate")
    public ResponseEntity<String> reactivateInventoryManager(@PathVariable Integer id) {
        userAccountService.reactivateInventoryManager(id);

        return ResponseEntity.ok(
                "Inventory Manager account reactivated successfully."
        );
    }

    @PostMapping("/inventory-managers/{id}/deletion-otp")
    public ResponseEntity<com.bakery.inventory.dto.useraccount.AdminDeletionOtpResponse> requestDeletionOtp(
            org.springframework.security.core.Authentication authentication,
            @PathVariable Integer id,
            @Valid @RequestBody com.bakery.inventory.dto.useraccount.AdminDeletionOtpRequest request) {
        com.bakery.inventory.security.CustomUserDetails userDetails = 
                (com.bakery.inventory.security.CustomUserDetails) authentication.getPrincipal();

        return ResponseEntity.ok(
                userAccountService.requestDeletionOtp(userDetails.getUserId(), id, request)
        );
    }

    @PostMapping("/inventory-managers/{id}/verify-deletion-otp")
    public ResponseEntity<com.bakery.inventory.dto.useraccount.AdminDeletionVerifyResponse> verifyDeletionOtp(
            org.springframework.security.core.Authentication authentication,
            @PathVariable Integer id,
            @Valid @RequestBody com.bakery.inventory.dto.useraccount.AdminDeletionVerifyRequest request) {
        com.bakery.inventory.security.CustomUserDetails userDetails = 
                (com.bakery.inventory.security.CustomUserDetails) authentication.getPrincipal();

        return ResponseEntity.ok(
                userAccountService.verifyDeletionOtp(userDetails.getUserId(), id, request)
        );
    }

    @PostMapping("/inventory-managers/{id}/confirm-delete")
    public ResponseEntity<String> confirmDeleteInventoryManager(
            org.springframework.security.core.Authentication authentication,
            @PathVariable Integer id,
            @Valid @RequestBody com.bakery.inventory.dto.useraccount.AdminDeletionConfirmRequest request) {
        com.bakery.inventory.security.CustomUserDetails userDetails = 
                (com.bakery.inventory.security.CustomUserDetails) authentication.getPrincipal();

        userAccountService.confirmDeleteInventoryManager(userDetails.getUserId(), id, request);

        return ResponseEntity.ok(
                "Inventory Manager account permanently deleted."
        );
    }
}