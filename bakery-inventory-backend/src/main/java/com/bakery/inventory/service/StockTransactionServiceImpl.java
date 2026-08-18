package com.bakery.inventory.service;

import com.bakery.inventory.dto.stocktransaction.StockTransactionResponse;
import com.bakery.inventory.entity.StockTransaction;
import com.bakery.inventory.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StockTransactionServiceImpl implements StockTransactionService {
    private final StockTransactionRepository stockTransactionRepository;

    @Override
    public List<StockTransactionResponse> getAllTransactions() {

        return stockTransactionRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<StockTransactionResponse> getTransactionsByProductId(
            Integer productId
    ) {

        return stockTransactionRepository
                .findByInventoryProductId(productId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<StockTransactionResponse> getTransactionsByCategoryId(Integer categoryId) {
        return stockTransactionRepository
                .findByInventoryProductCategoryId(categoryId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<StockTransactionResponse> getTransactionsByOrderId(Integer orderId) {
        return stockTransactionRepository
                .findByOrderId(orderId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private StockTransactionResponse mapToResponse(StockTransaction transaction) {

        return new StockTransactionResponse(
                transaction.getId(),
                transaction.getInventory().getId(),
                transaction.getType(),
                transaction.getQuantity(),
                transaction.getReason(),
                transaction.getOrder() != null ? transaction.getOrder().getId() : null,
                transaction.getCreatedAt()
        );
    }
}