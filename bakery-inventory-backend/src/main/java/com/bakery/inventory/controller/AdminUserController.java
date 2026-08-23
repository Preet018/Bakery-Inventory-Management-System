package com.bakery.inventory.controller;

import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;
import com.bakery.inventory.service.AuthService;
import com.bakery.inventory.service.UserAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Validated
public class AdminUserController {
    private final AuthService authService;
    private final UserAccountService userAccountService;

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

    @DeleteMapping("/inventory-managers/{id}")
    public ResponseEntity<String> deleteInventoryManager(@PathVariable Integer id) {
        userAccountService.deleteInventoryManager(id);

        return ResponseEntity.ok(
                "Inventory Manager account deleted successfully."
        );
    }
}