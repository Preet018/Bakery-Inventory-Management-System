package com.bakery.inventory.controller;

import com.bakery.inventory.dto.customerorder.CustomerOrderCreateRequest;
import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.dto.customerorder.CustomerOrderStatusUpdateRequest;
import com.bakery.inventory.security.CustomUserDetails;
import com.bakery.inventory.service.CustomerOrderService;
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
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Validated
public class CustomerOrderController {
    private final CustomerOrderService customerOrderService;

    @PostMapping
    public ResponseEntity<CustomerOrderResponse> createOrder(Authentication authentication, @Valid @RequestBody CustomerOrderCreateRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        CustomerOrderResponse response = customerOrderService.createOrder(userDetails.getUserId(), request);

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
    public ResponseEntity<CustomerOrderResponse> getOrderById(Authentication authentication, @Positive(message = "Order ID must be positive") @PathVariable Integer id) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        return ResponseEntity.ok(
                customerOrderService.getOrderById(id, userDetails.getUserId(), userDetails.getRoleName())
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CustomerOrderResponse>> getOrdersByUserId(Authentication authentication, @Positive(message = "User ID must be positive") @PathVariable Integer userId) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        return ResponseEntity.ok(
                customerOrderService.getOrdersByUserId(userId, userDetails.getUserId(), userDetails.getRoleName() )
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CustomerOrderResponse> updateOrderStatus(
            Authentication authentication,
            @Positive(message = "Order ID must be positive") @PathVariable Integer id,
            @Valid @RequestBody CustomerOrderStatusUpdateRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(
                customerOrderService.updateOrderStatus(
                        id,
                        request.getStatus(),
                        userDetails.getRoleName()
                )
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<CustomerOrderResponse> cancelOrder(Authentication authentication, @Positive(message = "Order ID must be positive") @PathVariable Integer id) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        return ResponseEntity.ok(
                customerOrderService.cancelOrder(id, userDetails.getUserId(), userDetails.getRoleName())
        );
    }
}