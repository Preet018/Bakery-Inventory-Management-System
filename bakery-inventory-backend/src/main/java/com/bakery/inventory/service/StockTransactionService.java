package com.bakery.inventory.service;

import com.bakery.inventory.dto.stocktransaction.StockTransactionResponse;
import java.util.List;

public interface StockTransactionService {
    StockTransactionResponse getTransactionById(Integer id);

    List<StockTransactionResponse> getAllTransactions();

    List<StockTransactionResponse> getTransactionsByProductId(Integer productId);

    List<StockTransactionResponse> getTransactionsByInventoryId(Integer inventoryId);
}