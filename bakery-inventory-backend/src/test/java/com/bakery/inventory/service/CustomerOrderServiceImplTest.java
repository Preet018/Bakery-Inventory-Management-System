package com.bakery.inventory.service;

import com.bakery.inventory.dto.customerorder.CustomerOrderCreateRequest;
import com.bakery.inventory.dto.customerorder.CustomerOrderResponse;
import com.bakery.inventory.dto.orderitem.OrderItemRequest;
import com.bakery.inventory.entity.*;
import com.bakery.inventory.exception.BusinessRuleException;
import com.bakery.inventory.repository.CustomerOrderRepository;
import com.bakery.inventory.repository.OrderItemRepository;
import com.bakery.inventory.repository.ProductRepository;
import com.bakery.inventory.repository.SavedAddressRepository;
import com.bakery.inventory.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerOrderServiceImplTest {

    @Mock
    private CustomerOrderRepository customerOrderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SavedAddressRepository savedAddressRepository;

    @Mock
    private InventoryReservationService inventoryReservationService;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private CustomerOrderServiceImpl customerOrderService;

    private UserAccount createCustomer(int id) {
        Role role = new Role();
        role.setName("CUSTOMER");

        UserAccount user = new UserAccount();
        user.setId(id);
        user.setUsername("customer" + id);
        user.setRole(role);
        user.setActive(true);
        user.setEmailVerified(true);

        return user;
    }

    private SavedAddress createAddress(
            int id,
            UserAccount user
    ) {
        SavedAddress address =
                new SavedAddress();

        address.setId(id);
        address.setUser(user);
        address.setLabel("Home");
        address.setAddressLine("123 Main Street");
        address.setCity("Bangalore");
        address.setState("Karnataka");
        address.setPostalCode("560001");
        address.setIsDefault(true);

        return address;
    }

    private Product createProduct(
            int id,
            boolean active
    ) {
        Product product =
                new Product();

        product.setId(id);
        product.setName("Chocolate Cake");
        product.setPrice(
                new BigDecimal("500.00")
        );
        product.setIsActive(active);

        return product;
    }

    private CustomerOrder createOrder(
            int id,
            UserAccount user,
            OrderStatus status
    ) {
        CustomerOrder order =
                new CustomerOrder();

        order.setId(id);
        order.setUser(user);
        order.setTotalAmount(
                new BigDecimal("500.00")
        );
        order.setOrderStatus(status);

        return order;
    }

    @Test
    void createOrder_shouldCreateOrderForCustomer() {
        UserAccount customer =
                createCustomer(1);

        SavedAddress address =
                createAddress(10, customer);

        Product product =
                createProduct(100, true);

        CustomerOrderCreateRequest request =
                new CustomerOrderCreateRequest(
                        "9876543210",
                        10,
                        PaymentMethod.UPI,
                        List.of(
                                new OrderItemRequest(
                                        100,
                                        1
                                )
                        )
                );

        when(userAccountRepository.findById(1))
                .thenReturn(Optional.of(customer));

        when(savedAddressRepository
                .findByIdAndUserId(10, 1))
                .thenReturn(Optional.of(address));

        when(customerOrderRepository.save(any(CustomerOrder.class)))
                .thenAnswer(invocation -> {
                    CustomerOrder order =
                            invocation.getArgument(0);

                    if (order.getId() == null) {
                        order.setId(500);
                    }

                    return order;
                });

        when(productRepository.findById(100))
                .thenReturn(Optional.of(product));

        when(orderItemRepository.saveAll(anyList()))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        when(paymentService.createPayment(
                eq(500),
                eq(PaymentMethod.UPI),
                eq(new BigDecimal("500.00"))
        )).thenReturn(null);

        when(orderItemRepository.findByOrderId(500))
                .thenReturn(List.of());

        CustomerOrderResponse response =
                customerOrderService.createOrder(
                        1,
                        request
                );

        assertNotNull(response);
        assertEquals(500, response.getId());
        assertEquals(
                new BigDecimal("500.00"),
                response.getTotalAmount()
        );

        verify(inventoryReservationService)
                .reserve(500, 100, 1);

        verify(paymentService)
                .createPayment(
                        500,
                        PaymentMethod.UPI,
                        new BigDecimal("500.00")
                );
    }

    @Test
    void createOrder_shouldRejectInactiveProduct() {
        UserAccount customer =
                createCustomer(1);

        SavedAddress address =
                createAddress(10, customer);

        Product product =
                createProduct(100, false);

        CustomerOrderCreateRequest request =
                new CustomerOrderCreateRequest(
                        "9876543210",
                        10,
                        PaymentMethod.UPI,
                        List.of(
                                new OrderItemRequest(
                                        100,
                                        1
                                )
                        )
                );

        when(userAccountRepository.findById(1))
                .thenReturn(Optional.of(customer));

        when(savedAddressRepository
                .findByIdAndUserId(10, 1))
                .thenReturn(Optional.of(address));

        when(customerOrderRepository.save(any(CustomerOrder.class)))
                .thenAnswer(invocation -> {
                    CustomerOrder order =
                            invocation.getArgument(0);

                    order.setId(500);

                    return order;
                });

        when(productRepository.findById(100))
                .thenReturn(Optional.of(product));

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () -> customerOrderService.createOrder(
                                1,
                                request
                        )
                );

        assertEquals(
                "Product is inactive with id: 100",
                exception.getMessage()
        );

        verifyNoInteractions(
                inventoryReservationService,
                paymentService
        );
    }

    @Test
    void getOrderById_shouldRejectAnotherUsersOrder() {

        UserAccount owner =
                createCustomer(1);

        CustomerOrder order =
                createOrder(
                        500,
                        owner,
                        OrderStatus.PLACED
                );

        when(customerOrderRepository.findById(500))
                .thenReturn(Optional.of(order));

        AccessDeniedException exception = // CHANGE
                assertThrows(
                        AccessDeniedException.class, // CHANGE
                        () -> customerOrderService.getOrderById(
                                500,
                                2,
                                "CUSTOMER"
                        )
                );

        assertEquals(
                "You are not authorized to access this order.",
                exception.getMessage()
        );

        verify(orderItemRepository, never())
                .findByOrderId(any());
    }

    @Test
    void updateOrderStatus_shouldRejectInvalidTransition() {
        UserAccount customer =
                createCustomer(1);

        CustomerOrder order =
                createOrder(
                        500,
                        customer,
                        OrderStatus.PLACED
                );

        when(customerOrderRepository.findById(500))
                .thenReturn(Optional.of(order));

        BusinessRuleException exception =
                assertThrows(
                        BusinessRuleException.class,
                        () -> customerOrderService.updateOrderStatus(
                                500,
                                OrderStatus.DELIVERED
                        )
                );

        assertEquals(
                "Invalid order status transition: PLACED -> DELIVERED",
                exception.getMessage()
        );

        verify(customerOrderRepository, never())
                .save(any(CustomerOrder.class));
    }
}