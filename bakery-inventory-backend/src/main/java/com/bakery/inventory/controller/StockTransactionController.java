package com.bakery.inventory.controller;

import com.bakery.inventory.dto.stocktransaction.StockTransactionResponse;
import com.bakery.inventory.service.StockTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-transactions")
@RequiredArgsConstructor
public class StockTransactionController {
    private final StockTransactionService stockTransactionService;

    @GetMapping
    public ResponseEntity<List<StockTransactionResponse>> getAllTransactions() {
        return ResponseEntity.ok(
                stockTransactionService.getAllTransactions()
        );
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<StockTransactionResponse>> getTransactionsByProductId(@PathVariable Integer productId) {
        return ResponseEntity.ok(
                stockTransactionService.getTransactionsByProductId(productId)
        );
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<StockTransactionResponse>> getTransactionsByCategoryId(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(
                stockTransactionService.getTransactionsByCategoryId(categoryId)
        );
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<StockTransactionResponse>> getTransactionsByOrderId(@PathVariable Integer orderId) {
        return ResponseEntity.ok(
                stockTransactionService.getTransactionsByOrderId(orderId)
        );
    }
}