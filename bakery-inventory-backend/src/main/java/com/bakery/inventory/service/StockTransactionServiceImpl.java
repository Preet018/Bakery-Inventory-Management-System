package com.bakery.inventory.service;

import com.bakery.inventory.dto.stocktransaction.StockTransactionResponse;
import com.bakery.inventory.entity.StockTransaction;
import com.bakery.inventory.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StockTransactionServiceImpl
        implements StockTransactionService {

    private final StockTransactionRepository stockTransactionRepository;

    @Override
    public StockTransactionResponse getTransactionById(Integer id) {

        StockTransaction transaction =
                stockTransactionRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Stock transaction not found with id: "
                                                + id
                                )
                        );

        return mapToResponse(transaction);
    }

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
    public List<StockTransactionResponse> getTransactionsByInventoryId(
            Integer inventoryId
    ) {

        return stockTransactionRepository
                .findByInventoryId(inventoryId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private StockTransactionResponse mapToResponse(
            StockTransaction transaction
    ) {

        return new StockTransactionResponse(
                transaction.getId(),
                transaction.getInventory().getId(),
                transaction.getType(),
                transaction.getQuantity(),
                transaction.getReason(),
                transaction.getReferenceId(),
                transaction.getCreatedAt()
        );
    }
}