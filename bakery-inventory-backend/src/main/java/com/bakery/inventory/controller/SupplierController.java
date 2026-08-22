package com.bakery.inventory.controller;

import com.bakery.inventory.dto.supplier.SupplierRequest;
import com.bakery.inventory.dto.supplier.SupplierResponse;
import com.bakery.inventory.service.SupplierService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Validated
public class SupplierController {
    private final SupplierService supplierService;

    @PostMapping
    public ResponseEntity<SupplierResponse> createSupplier(@Valid @RequestBody SupplierRequest request) {
        SupplierResponse response = supplierService.createSupplier(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> getAllSuppliers() {
        return ResponseEntity.ok(
                supplierService.getAllSuppliers()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> getSupplierById(@Positive(message = "Supplier ID must be positive") @PathVariable Integer id) {
        return ResponseEntity.ok(
                supplierService.getSupplierById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> updateSupplier(@Positive(message = "Supplier ID must be positive") @PathVariable Integer id, @Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.ok(
                supplierService.updateSupplier(id, request)
        );
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateSupplier(@Positive(message = "Supplier ID must be positive") @PathVariable Integer id) {
        supplierService.deactivateSupplier(id);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateSupplier(@Positive(message = "Supplier ID must be positive") @PathVariable Integer id) {
        supplierService.activateSupplier(id);

        return ResponseEntity.noContent().build();
    }
}