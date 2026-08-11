package com.bakery.inventory.service;

import com.bakery.inventory.dto.supplier.SupplierRequest;
import com.bakery.inventory.dto.supplier.SupplierResponse;
import com.bakery.inventory.entity.Supplier;
import com.bakery.inventory.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    @Override
    public SupplierResponse createSupplier(SupplierRequest request) {

        Supplier supplier = new Supplier();

        supplier.setName(request.getName());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());

        Supplier savedSupplier = supplierRepository.save(supplier);

        return new SupplierResponse(
                savedSupplier.getId(),
                savedSupplier.getName(),
                savedSupplier.getEmail(),
                savedSupplier.getPhone(),
                savedSupplier.getAddress()
        );
    }

    @Override
    public List<SupplierResponse> getAllSuppliers() {

        return supplierRepository.findAll()
                .stream()
                .map(supplier -> new SupplierResponse(
                        supplier.getId(),
                        supplier.getName(),
                        supplier.getEmail(),
                        supplier.getPhone(),
                        supplier.getAddress()
                ))
                .toList();
    }

    @Override
    public SupplierResponse getSupplierById(Integer id) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Supplier not found with id: " + id
                        )
                );

        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getEmail(),
                supplier.getPhone(),
                supplier.getAddress()
        );
    }

    @Override
    public SupplierResponse updateSupplier(
            Integer id,
            SupplierRequest request
    ) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Supplier not found with id: " + id
                        )
                );

        supplier.setName(request.getName());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());

        Supplier updatedSupplier = supplierRepository.save(supplier);

        return new SupplierResponse(
                updatedSupplier.getId(),
                updatedSupplier.getName(),
                updatedSupplier.getEmail(),
                updatedSupplier.getPhone(),
                updatedSupplier.getAddress()
        );
    }

    @Override
    public void deleteSupplier(Integer id) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Supplier not found with id: " + id
                        )
                );

        supplierRepository.delete(supplier);
    }
}