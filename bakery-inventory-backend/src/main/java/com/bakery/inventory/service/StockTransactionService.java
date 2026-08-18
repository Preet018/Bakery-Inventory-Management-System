package com.bakery.inventory.service;

import com.bakery.inventory.dto.stocktransaction.StockTransactionResponse;
import java.util.List;

public interface StockTransactionService {
    List<StockTransactionResponse> getAllTransactions();

    List<StockTransactionResponse> getTransactionsByProductId(Integer productId);

    List<StockTransactionResponse> getTransactionsByCategoryId(Integer categoryId);

    List<StockTransactionResponse> getTransactionsByOrderId(Integer orderId);
}