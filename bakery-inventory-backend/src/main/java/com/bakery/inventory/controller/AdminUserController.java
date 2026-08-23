package com.bakery.inventory.controller;

import com.bakery.inventory.dto.useraccount.AccountRegistrationRequest;
import com.bakery.inventory.service.AuthService;
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

    @PostMapping("/inventory-managers")
    public ResponseEntity<String> registerInventoryManager(@Valid @RequestBody AccountRegistrationRequest request) {
        authService.registerInventoryManager(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        "Inventory Manager registered successfully. A verification OTP has been sent to the registered email."
                );
    }
}