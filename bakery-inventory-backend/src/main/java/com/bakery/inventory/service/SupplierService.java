package com.bakery.inventory.service;

import com.bakery.inventory.dto.supplier.SupplierRequest;
import com.bakery.inventory.dto.supplier.SupplierResponse;

import java.util.List;

public interface SupplierService {

    SupplierResponse createSupplier(SupplierRequest request);

    List<SupplierResponse> getAllSuppliers();

    SupplierResponse getSupplierById(Integer id);

    SupplierResponse updateSupplier(Integer id, SupplierRequest request);

    void deactivateSupplier(Integer id);

    void activateSupplier(Integer id);
}