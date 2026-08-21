-- CHANGE: Added minimal users required for order/payment testing.
INSERT INTO User_Account
    (username, password_hash, email, address, role_id)
VALUES
    ('admin', 'dummy-hash', 'admin@bakery.com', 'Bangalore, Karnataka', 1),
    ('inventory_manager', 'dummy-hash', 'manager@bakery.com', 'Bangalore, Karnataka', 2),
    ('customer', 'dummy-hash', 'customer@bakery.com', 'Bangalore, Karnataka', 3);


-- CHANGE: Added category required by test products.
INSERT INTO Category (name)
VALUES ('Cakes');


-- CHANGE: Added supplier required by test products.
INSERT INTO Supplier
    (name, email, phone, address)
VALUES
    (
        'Bakery Supplies',
        'supplies@bakery.test',
        '9000000001',
        'Bangalore, Karnataka'
    );


-- CHANGE: Added active product with sufficient stock.
INSERT INTO Product
    (name, description, price, category_id, supplier_id, is_active)
VALUES
    (
        'Chocolate Cake',
        'Rich chocolate cake with chocolate frosting',
        550.00,
        1,
        1,
        TRUE
    );

-- CHANGE: Added active product with limited stock.
INSERT INTO Product
    (name, description, price, category_id, supplier_id, is_active)
VALUES
    (
        'Butter Croissant',
        'Classic butter croissant',
        120.00,
        1,
        1,
        TRUE
    );

-- CHANGE: Added inactive product for negative testing.
INSERT INTO Product
    (name, description, price, category_id, supplier_id, is_active)
VALUES
    (
        'Red Velvet Cake',
        'Classic red velvet cake',
        650.00,
        1,
        1,
        FALSE
    );


-- CHANGE: Added sufficient stock for successful order testing.
INSERT INTO Inventory
    (product_id, quantity, reserved_quantity, minimum_stock)
VALUES
    (1, 20, 0, 5);

-- CHANGE: Added limited stock for insufficient-stock testing.
INSERT INTO Inventory
    (product_id, quantity, reserved_quantity, minimum_stock)
VALUES
    (2, 5, 0, 2);

-- CHANGE: Added inventory for inactive-product testing.
INSERT INTO Inventory
    (product_id, quantity, reserved_quantity, minimum_stock)
VALUES
    (3, 10, 0, 5);


-- CHANGE: Added pending order for PaymentController testing.
INSERT INTO Customer_Order
    (
        user_id,
        contact,
        delivery_address,
        total_amount,
        order_status
    )
VALUES
    (
        3,
        '9000000002',
        'Bangalore, Karnataka',
        550.00,
        'PLACED'
    );


-- CHANGE: Added order item for the pending test order.
INSERT INTO Order_Item
    (
        order_id,
        product_id,
        quantity,
        unit_price,
        subtotal
    )
VALUES
    (
        1,
        1,
        1,
        550.00,
        550.00
    );


-- CHANGE: Added pending payment for the test order.
INSERT INTO Payment
    (
        order_id,
        payment_method,
        payment_status,
        provider,
        provider_order_id,
        provider_payment_id,
        provider_signature,
        amount,
        currency
    )
VALUES
    (
        1,
        'UPI',
        'PENDING',
        'RAZORPAY',
        'test_order_001',
        NULL,
        NULL,
        550.00,
        'INR'
    );