package com.bakery.inventory.controller;

import com.bakery.inventory.dto.customerorder.CustomerOrderCreateRequest;
import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.dto.customerorder.CustomerOrderStatusUpdateRequest;
import com.bakery.inventory.service.CustomerOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class CustomerOrderController {
    private final CustomerOrderService customerOrderService;

    @PostMapping
    public ResponseEntity<CustomerOrderResponse> createOrder(@RequestBody CustomerOrderCreateRequest request) {
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
    public ResponseEntity<CustomerOrderResponse> getOrderById(@PathVariable Integer id) {
        return ResponseEntity.ok(
                customerOrderService.getOrderById(id)
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CustomerOrderResponse>> getOrdersByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(
                customerOrderService.getOrdersByUserId(userId)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CustomerOrderResponse> updateOrderStatus(@PathVariable Integer id, @RequestBody CustomerOrderStatusUpdateRequest request) {
        return ResponseEntity.ok(
                customerOrderService.updateOrderStatus(
                        id,
                        request.getStatus()
                )
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<CustomerOrderResponse> cancelOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(
                customerOrderService.cancelOrder(id)
        );
    }
}