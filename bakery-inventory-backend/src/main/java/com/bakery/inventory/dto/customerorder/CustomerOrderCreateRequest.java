package com.bakery.inventory.dto.customerorder;

import com.bakery.inventory.dto.orderitem.OrderItemRequest;
import com.bakery.inventory.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderCreateRequest {
    @NotBlank(message = "Contact is required")
    private String contact;

    @NotNull(message = "Saved address ID is required")
    @Positive(message = "Saved address ID must be positive")
    private Integer savedAddressId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;
}