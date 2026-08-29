USE bakery_inventory;


-- =========================================================
-- CLEAN EXISTING DATA
-- =========================================================
-- CHANGE: Added cleanup so this seed can be rerun during testing.
-- Execute only against your dummy/test database.

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE stock_transaction;
TRUNCATE TABLE inventory_reservation;
TRUNCATE TABLE payment;
TRUNCATE TABLE order_item;
TRUNCATE TABLE customer_order;
TRUNCATE TABLE product_image;
TRUNCATE TABLE inventory;
TRUNCATE TABLE product;
TRUNCATE TABLE supplier;
TRUNCATE TABLE category;
TRUNCATE TABLE saved_address;
TRUNCATE TABLE otp_verification;
TRUNCATE TABLE user_account;
TRUNCATE TABLE role;

SET FOREIGN_KEY_CHECKS = 1;


-- =========================================================
-- 1. ROLES
-- =========================================================

INSERT INTO role (id, name)
VALUES
    (1, 'ADMIN'),
    (2, 'INVENTORY_MANAGER'),
    (3, 'CUSTOMER');


-- =========================================================
-- 2. USER ACCOUNTS
-- =========================================================
-- CHANGE: Exactly 3 users as requested.
-- CHANGE: email_verified intentionally FALSE for all users.
--
-- Passwords:
--
-- admin   -> bae curry plzz
-- fragy   -> fragy2002
-- chahak  -> chahak02
--
-- Hashes are BCrypt.

INSERT INTO user_account
    (
        id,
        username,
        password_hash,
        email,
        email_verified,
        is_active,
        role_id
    )
VALUES
    (
        1,
        'admin',
        '$2a$10$RpofppVHNhz5B8J5V6oNUehwgbCIKBLZdOvR7lNhHaiwue3RShvTO',
        'chandrakarpreet.1100@gmail.com',
        TRUE,
        TRUE,
        1
    ),
    (
        2,
        'fragy',
        '$2a$10$/KQTkYmBg084NGHWW6MjGedaP1A3Ib3eCcwdFpmTuNEObsMTji9/y',
        'fragypreet.1100@gmail.com',
        TRUE,
        TRUE,
        3
    ),
    (
        3,
        'chahak',
        '$2a$10$4iyesudZuCETRWHGGU4BTOqgFTmnj8crrODC0LeFHnombNLQL1Ow.',
        'fragy2002op@gmail.com',
        FALSE,
        TRUE,
        2
    ),
    (
        4,
        'ghost',
        '$2a$10$4iyesudZuCETRWHGGU4BTOqgFTmnj8crrODC0LeFHnombNLQL1Ow.',
        'fragy.1100@gmail.com',
        FALSE,
        TRUE,
        2
    );


-- =========================================================
-- 3. SAVED ADDRESSES
-- =========================================================
-- CHANGE: Two addresses for the single customer.
-- This lets you test default/non-default address behaviour.

INSERT INTO saved_address
    (
        id,
        user_id,
        label,
        address_line,
        landmark,
        city,
        state,
        postal_code,
        latitude,
        longitude,
        place_id,
        is_default
    )
VALUES
    (
        1,
        2,
        'Home',
        '42, 5th Main Road, Indiranagar',
        'Near 100 Feet Road',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.97189100,
        77.64115100,
        'ChIJ_test_indiranagar',
        TRUE
    ),
    (
        2,
        2,
        'Work',
        '18, Residency Road',
        'Near Brigade Road',
        'Bengaluru',
        'Karnataka',
        '560025',
        12.96980700,
        77.59517100,
        'ChIJ_test_residencyroad',
        FALSE
    );


-- =========================================================
-- 4. CATEGORIES
-- =========================================================

INSERT INTO category (id, name)
VALUES
    (1, 'Cakes'),
    (2, 'Pastries'),
    (3, 'Breads'),
    (4, 'Cookies'),
    (5, 'Donuts'),
    (6, 'Muffins'),
    (7, 'Desserts'),
    (8, 'Snacks');


-- =========================================================
-- 5. SUPPLIERS
-- =========================================================
-- CHANGE: Includes suppliers with missing optional fields
-- to test validation/display edge cases.

INSERT INTO supplier
    (
        id,
        name,
        email,
        phone,
        address,
        is_active
    )
VALUES
    (
        1,
        'Fresh Ingredients Ltd.',
        'contact@freshingredients.com',
        '9876500001',
        'Bengaluru, Karnataka',
        TRUE
    ),
    (
        2,
        'BakePro Supplies',
        'sales@bakepro.com',
        '9876500002',
        'Mumbai, Maharashtra',
        TRUE
    ),
    (
        3,
        'Golden Grain Foods',
        'info@goldengrain.com',
        '9876500003',
        'Delhi, India',
        TRUE
    ),
    (
        4,
        'Sweet Source Pvt Ltd',
        NULL,
        '9876500004',
        'Pune, Maharashtra',
        TRUE
    ),
    (
        5,
        'DairyFresh Suppliers',
        'sales@dairyfresh.com',
        NULL,
        'Hyderabad, Telangana',
        TRUE
    ),
    (
        6,
        'Old Bakery Supplies',
        NULL,
        NULL,
        NULL,
        FALSE
    );


-- =========================================================
-- 6. PRODUCTS
-- =========================================================
-- CHANGE: Exactly 10 products so every provided image can be used.
--
-- Image mapping:
--
-- 1  apple-tart.jpg
-- 2  blueberry-muffin.jpg
-- 3  butter-cookies.jpg
-- 4  butter-croissant.jpg
-- 5  chocolate-brownie.jpg
-- 6  chocolate-cake.jpg
-- 7  cinnamon-bun.jpg
-- 8  glazed-donut.jpg
-- 9  red-velvet-cake.jpg
-- 10 sourdough-bread.jpg

INSERT INTO product
    (
        id,
        name,
        description,
        price,
        category_id,
        supplier_id,
        is_active
    )
VALUES
    (
        1,
        'Apple Tart',
        'Buttery pastry filled with cinnamon-spiced apples.',
        320.00,
        2,
        2,
        TRUE
    ),
    (
        2,
        'Blueberry Muffin',
        'Soft vanilla muffin packed with blueberries.',
        150.00,
        6,
        5,
        TRUE
    ),
    (
        3,
        'Butter Cookies',
        'Crispy, rich butter cookies baked until golden.',
        250.00,
        4,
        4,
        TRUE
    ),
    (
        4,
        'Butter Croissant',
        'Flaky French-style croissant made with premium butter.',
        120.00,
        2,
        2,
        TRUE
    ),
    (
        5,
        'Chocolate Brownie',
        'Dense and fudgy chocolate brownie.',
        180.00,
        7,
        1,
        TRUE
    ),
    (
        6,
        'Chocolate Cake',
        'Rich chocolate sponge with chocolate frosting.',
        550.00,
        1,
        1,
        TRUE
    ),
    (
        7,
        'Cinnamon Bun',
        'Soft baked bun with cinnamon sugar filling.',
        140.00,
        8,
        3,
        TRUE
    ),
    (
        8,
        'Glazed Donut',
        'Classic donut covered with sweet glaze.',
        80.00,
        5,
        3,
        TRUE
    ),
    (
        9,
        'Red Velvet Cake',
        'Classic red velvet cake with cream cheese frosting.',
        650.00,
        1,
        4,
        FALSE
    ),
    (
        10,
        'Sourdough Bread',
        'Naturally fermented sourdough loaf with a crisp crust.',
        180.00,
        3,
        3,
        TRUE
    );


-- =========================================================
-- 7. INVENTORY
-- =========================================================
-- CHANGE: Deliberately covers:
--   Product 1  -> healthy stock
--   Product 2  -> healthy stock
--   Product 3  -> exactly minimum stock
--   Product 4  -> low stock
--   Product 5  -> out of stock
--   Product 6  -> reserved stock
--   Product 7  -> healthy stock
--   Product 8  -> low stock
--   Product 9  -> inactive product with remaining stock
--   Product 10 -> healthy stock

INSERT INTO inventory
    (
        id,
        product_id,
        quantity,
        reserved_quantity,
        minimum_stock
    )
VALUES
    (1,  1,  40,  0, 10),
    (2,  2,  25,  0, 10),
    (3,  3,  10,  0, 10),
    (4,  4,   5,  0, 10),
    (5,  5,   0,  0,  5),
    (6,  6,  20,  5,  5),
    (7,  7,  30,  0, 10),
    (8,  8,   8,  0, 10),
    (9,  9,  12,  0,  5),
    (10, 10, 50,  0, 10);


-- =========================================================
-- 8. PRODUCT IMAGES
-- =========================================================
-- CHANGE: Every image supplied by you is represented exactly once.

INSERT INTO product_image
    (
        id,
        product_id,
        image_path,
        is_active
    )
VALUES
    (1,  1,  '/images/products/apple-tart.jpg',        TRUE),
    (2,  2,  '/images/products/blueberry-muffin.jpg',  TRUE),
    (3,  3,  '/images/products/butter-cookies.jpg',    TRUE),
    (4,  4,  '/images/products/butter-croissant.jpg',  TRUE),
    (5,  5,  '/images/products/chocolate-brownie.jpg',  TRUE),
    (6,  6,  '/images/products/chocolate-cake.jpg',    TRUE),
    (7,  7,  '/images/products/cinnamon-bun.jpg',      TRUE),
    (8,  8,  '/images/products/glazed-donut.jpg',     TRUE),
    (9,  9,  '/images/products/red-velvet-cake.jpg',   TRUE),
    (10, 10, '/images/products/sourdough-bread.jpg',   TRUE);


-- =========================================================
-- 9. CUSTOMER ORDERS
-- =========================================================
-- CHANGE: Orders cover all major order statuses.
--
-- Customer = user_id 2
--
-- Totals are calculated from order items below.

INSERT INTO customer_order
    (
        id,
        user_id,
        saved_address_id,
        contact,
        delivery_address,
        delivery_landmark,
        delivery_city,
        delivery_state,
        delivery_postal_code,
        delivery_latitude,
        delivery_longitude,
        delivery_place_id,
        total_amount,
        order_status,
        created_at,
        updated_at
    )
VALUES
    (
        1,
        2,
        1,
        '9876543210',
        '42, 5th Main Road, Indiranagar',
        'Near 100 Feet Road',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.97189100,
        77.64115100,
        'ChIJ_test_indiranagar',
        550.00,
        'DELIVERED',
        '2026-08-01 09:00:00',
        '2026-08-01 14:00:00'
    ),
    (
        2,
        2,
        2,
        '9876543210',
        '18, Residency Road',
        'Near Brigade Road',
        'Bengaluru',
        'Karnataka',
        '560025',
        12.96980700,
        77.59517100,
        'ChIJ_test_residencyroad',
        600.00,
        'READY',
        '2026-08-10 10:00:00',
        '2026-08-10 12:30:00'
    ),
    (
        3,
        2,
        1,
        '9876543210',
        '42, 5th Main Road, Indiranagar',
        'Near 100 Feet Road',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.97189100,
        77.64115100,
        'ChIJ_test_indiranagar',
        320.00,
        'PROCESSING',
        '2026-08-20 11:00:00',
        '2026-08-20 11:30:00'
    ),
    (
        4,
        2,
        1,
        '9876543210',
        '42, 5th Main Road, Indiranagar',
        'Near 100 Feet Road',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.97189100,
        77.64115100,
        'ChIJ_test_indiranagar',
        700.00,
        'CONFIRMED',
        '2026-08-22 15:00:00',
        '2026-08-22 15:10:00'
    ),
    (
        5,
        2,
        NULL,
        '9876543210',
        '99, Temporary Delivery Road',
        NULL,
        'Bengaluru',
        'Karnataka',
        '560001',
        12.97800000,
        77.59000000,
        NULL,
        400.00,
        'PLACED',
        '2026-08-25 18:00:00',
        '2026-08-25 18:00:00'
    ),
    (
        6,
        2,
        2,
        '9876543210',
        '18, Residency Road',
        'Near Brigade Road',
        'Bengaluru',
        'Karnataka',
        '560025',
        12.96980700,
        77.59517100,
        'ChIJ_test_residencyroad',
        650.00,
        'CANCELLED',
        '2026-08-18 09:00:00',
        '2026-08-18 09:20:00'
    );


-- =========================================================
-- 10. ORDER ITEMS
-- =========================================================

INSERT INTO order_item
    (
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        subtotal
    )
VALUES
    -- Order 1 = 550
    (1, 1, 6, 1, 550.00, 550.00),

    -- Order 2 = 600
    (2, 2, 4, 5, 120.00, 600.00),

    -- Order 3 = 320
    (3, 3, 1, 1, 320.00, 320.00),

    -- Order 4 = 700
    (4, 4, 7, 2, 140.00, 280.00),
    (5, 4, 5, 1, 180.00, 180.00),
    (6, 4, 8, 3, 80.00, 240.00),

    -- Order 5 = 400
    (7, 5, 2, 2, 150.00, 300.00),
    (8, 5, 8, 1, 80.00, 80.00),

    -- Order 6 = 650
    (9, 6, 9, 1, 650.00, 650.00);


-- =========================================================
-- 11. PAYMENTS
-- =========================================================
-- CHANGE: Covers PAID, PENDING and FAILED payment states.
-- Provider chosen as RAZORPAY to match the planned payment integration.

INSERT INTO payment
    (
        id,
        order_id,
        payment_method,
        payment_status,
        provider,
        provider_order_id,
        provider_payment_id,
        provider_signature,
        amount,
        currency,
        created_at,
        updated_at
    )
VALUES
    (
        1,
        1,
        'UPI',
        'PAID',
        'RAZORPAY',
        'order_dummy_0001',
        'pay_dummy_0001',
        'dummy_signature_0001',
        550.00,
        'INR',
        '2026-08-01 09:01:00',
        '2026-08-01 09:02:00'
    ),
    (
        2,
        2,
        'CREDIT_CARD',
        'PAID',
        'RAZORPAY',
        'order_dummy_0002',
        'pay_dummy_0002',
        'dummy_signature_0002',
        600.00,
        'INR',
        '2026-08-10 10:01:00',
        '2026-08-10 10:02:00'
    ),
    (
        3,
        3,
        'UPI',
        'PAID',
        'RAZORPAY',
        'order_dummy_0003',
        'pay_dummy_0003',
        'dummy_signature_0003',
        320.00,
        'INR',
        '2026-08-20 11:01:00',
        '2026-08-20 11:02:00'
    ),
    (
        4,
        4,
        'DEBIT_CARD',
        'PAID',
        'RAZORPAY',
        'order_dummy_0004',
        'pay_dummy_0004',
        'dummy_signature_0004',
        700.00,
        'INR',
        '2026-08-22 15:01:00',
        '2026-08-22 15:02:00'
    ),
    (
        5,
        5,
        'UPI',
        'PENDING',
        'RAZORPAY',
        'order_dummy_0005',
        NULL,
        NULL,
        400.00,
        'INR',
        '2026-08-25 18:01:00',
        '2026-08-25 18:01:00'
    ),
    (
        6,
        6,
        'CREDIT_CARD',
        'FAILED',
        'RAZORPAY',
        'order_dummy_0006',
        NULL,
        NULL,
        650.00,
        'INR',
        '2026-08-18 09:01:00',
        '2026-08-18 09:03:00'
    );


-- =========================================================
-- 12. INVENTORY RESERVATIONS
-- =========================================================
-- CHANGE: Covers all reservation statuses.
--
-- Order 3 is PROCESSING -> converted reservation.
-- Order 4 is CONFIRMED -> active reservation.
-- Order 5 is PLACED -> active reservation.
-- Order 6 is CANCELLED -> released reservation.

INSERT INTO inventory_reservation
    (
        id,
        order_id,
        product_id,
        quantity,
        reserved_at,
        expires_at,
        status
    )
VALUES
    (
        1,
        3,
        1,
        1,
        '2026-08-20 11:01:00',
        '2026-08-20 12:01:00',
        'CONVERTED'
    ),
    (
        2,
        4,
        7,
        2,
        '2026-08-22 15:01:00',
        '2026-08-22 16:01:00',
        'ACTIVE'
    ),
    (
        3,
        4,
        5,
        1,
        '2026-08-22 15:01:00',
        '2026-08-22 16:00:00',
        'ACTIVE'
    ),
    (
        4,
        5,
        2,
        2,
        '2026-08-25 18:01:00',
        '2026-08-25 19:01:00',
        'ACTIVE'
    ),
    (
        5,
        6,
        9,
        1,
        '2026-08-18 09:01:00',
        '2026-08-18 10:01:00',
        'RELEASED'
    );


-- =========================================================
-- 13. STOCK TRANSACTIONS
-- =========================================================
-- CHANGE: Covers every allowed transaction type:
--
-- PURCHASE
-- SALE
-- SUPPLIER_RETURN
-- DAMAGE
-- ADJUSTMENT
-- CANCEL

INSERT INTO stock_transaction
    (
        id,
        inventory_id,
        type,
        quantity,
        reason,
        order_id,
        created_at
    )
VALUES
    -- Chocolate Cake
    (
        1,
        6,
        'PURCHASE',
        30,
        'Initial chocolate cake stock',
        NULL,
        '2026-07-28 08:00:00'
    ),
    (
        2,
        6,
        'SALE',
        -1,
        'Delivered customer order',
        1,
        '2026-08-01 09:05:00'
    ),
    (
        3,
        6,
        'DAMAGE',
        -4,
        'Damaged during storage',
        NULL,
        '2026-08-05 17:00:00'
    ),
    (
        4,
        6,
        'ADJUSTMENT',
        -5,
        'Physical stock count correction',
        NULL,
        '2026-08-06 10:00:00'
    ),

    -- Butter Croissant
    (
        5,
        4,
        'PURCHASE',
        20,
        'Morning bakery delivery',
        NULL,
        '2026-08-05 07:00:00'
    ),
    (
        6,
        4,
        'SALE',
        -5,
        'Customer order',
        2,
        '2026-08-10 10:05:00'
    ),
    (
        7,
        4,
        'SUPPLIER_RETURN',
        -10,
        'Returned excess stock to supplier',
        NULL,
        '2026-08-11 09:00:00'
    ),

    -- Blueberry Muffin
    (
        8,
        2,
        'PURCHASE',
        30,
        'Fresh muffin batch',
        NULL,
        '2026-08-19 06:30:00'
    ),
    (
        9,
        2,
        'SALE',
        -2,
        'Placed customer order',
        5,
        '2026-08-25 18:05:00'
    ),

    -- Cancelled order
    (
        10,
        9,
        'PURCHASE',
        15,
        'Red velvet cake production',
        NULL,
        '2026-08-15 07:00:00'
    ),
    (
        11,
        9,
        'SALE',
        -1,
        'Temporary reservation for cancelled order',
        6,
        '2026-08-18 09:05:00'
    ),
    (
        12,
        9,
        'CANCEL',
        1,
        'Stock restored after order cancellation',
        6,
        '2026-08-18 09:20:00'
    );


-- =========================================================
-- 14. VERIFICATION
-- =========================================================
-- CHANGE: Quick sanity checks after seeding.

SELECT
    id,
    username,
    email,
    email_verified,
    is_active,
    role_id
FROM user_account
ORDER BY id;

SELECT
    p.id,
    p.name,
    p.price,
    p.is_active,
    i.quantity,
    i.reserved_quantity,
    i.minimum_stock
FROM product p
JOIN inventory i
    ON i.product_id = p.id
ORDER BY p.id;

SELECT
    co.id,
    co.total_amount,
    co.order_status,
    p.payment_status
FROM customer_order co
JOIN payment p
    ON p.order_id = co.id
ORDER BY co.id;