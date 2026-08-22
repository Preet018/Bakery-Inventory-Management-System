package com.bakery.inventory.controller;

import com.bakery.inventory.dto.customerorder.CustomerOrderCreateRequest;
import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.dto.customerorder.CustomerOrderStatusUpdateRequest;
import com.bakery.inventory.service.CustomerOrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Validated
public class CustomerOrderController {
    private final CustomerOrderService customerOrderService;

    @PostMapping
    public ResponseEntity<CustomerOrderResponse> createOrder(@Valid @RequestBody CustomerOrderCreateRequest request) {
        CustomerOrderResponse response = customerOrderService.createOrder(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<CustomerOrderResponse>> getAllOrders() {
        return ResponseEntity.ok(
                customerOrderService.getAllOrders()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerOrderResponse> getOrderById(@Positive(message = "Order ID must be positive") @PathVariable Integer id) {
        return ResponseEntity.ok(
                customerOrderService.getOrderById(id)
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CustomerOrderResponse>> getOrdersByUserId(@Positive(message = "User ID must be positive") @PathVariable Integer userId) {
        return ResponseEntity.ok(
                customerOrderService.getOrdersByUserId(userId)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CustomerOrderResponse> updateOrderStatus(@Positive(message = "Order ID must be positive") @PathVariable Integer id, @Valid @RequestBody CustomerOrderStatusUpdateRequest request) {
        return ResponseEntity.ok(
                customerOrderService.updateOrderStatus(
                        id,
                        request.getStatus()
                )
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<CustomerOrderResponse> cancelOrder(@Positive(message = "Order ID must be positive") @PathVariable Integer id) {
        return ResponseEntity.ok(
                customerOrderService.cancelOrder(id)
        );
    }
}