USE bakery_inventory;


-- =========================================================
-- 1. ROLES
-- =========================================================

INSERT INTO role (name)
VALUES
    ('ADMIN'),
    ('INVENTORY_MANAGER'),
    ('CUSTOMER');


-- =========================================================
-- 2. USER ACCOUNTS
-- =========================================================
-- Dummy password for all users:
-- password
--
-- Stored value is a BCrypt hash, NOT plaintext.

INSERT INTO user_account
    (username, password_hash, email, address, role_id)
VALUES
    (
        'admin',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'admin@bakery.com',
        'Bangalore, Karnataka',
        1
    ),
    (
        'inventory_manager',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'manager@bakery.com',
        'Bangalore, Karnataka',
        2
    ),
    (
        'preet',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'preet@example.com',
        'Bangalore, Karnataka',
        3
    ),
    (
        'rahul',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'rahul@example.com',
        'Mumbai, Maharashtra',
        3
    ),
    (
        'ananya',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'ananya@example.com',
        'Delhi, India',
        3
    ),
    (
        'rohit',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'rohit@example.com',
        NULL,
        3
    ),
    (
        'neha',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'neha@example.com',
        'Pune, Maharashtra',
        3
    ),
    (
        'arjun',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'arjun@example.com',
        'Hyderabad, Telangana',
        3
    ),
    (
        'simran',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'simran@example.com',
        'Chandigarh, India',
        3
    ),
    (
        'vishal',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'vishal@example.com',
        'Chennai, Tamil Nadu',
        3
    );


-- =========================================================
-- 3. CATEGORIES
-- =========================================================

INSERT INTO category (name)
VALUES
    ('Cakes'),
    ('Pastries'),
    ('Breads'),
    ('Cookies'),
    ('Donuts'),
    ('Muffins'),
    ('Desserts'),
    ('Snacks');


-- =========================================================
-- 4. SUPPLIERS
-- =========================================================

INSERT INTO supplier
    (name, email, phone, address)
VALUES
    (
        'Fresh Ingredients Ltd.',
        'contact@freshingredients.com',
        '9876500001',
        'Bangalore, Karnataka'
    ),
    (
        'BakePro Supplies',
        'sales@bakepro.com',
        '9876500002',
        'Mumbai, Maharashtra'
    ),
    (
        'Golden Grain Foods',
        'info@goldengrain.com',
        '9876500003',
        'Delhi, India'
    ),
    (
        'Sweet Source Pvt Ltd',
        'contact@sweetsource.com',
        '9876500004',
        'Pune, Maharashtra'
    ),
    (
        'DairyFresh Suppliers',
        'sales@dairyfresh.com',
        '9876500005',
        'Hyderabad, Telangana'
    ),
    (
        'Premium Flour Co.',
        NULL,
        '9876500006',
        'Chennai, Tamil Nadu'
    ),
    (
        'Bakers Choice',
        'support@bakerschoice.com',
        NULL,
        'Kolkata, West Bengal'
    ),
    (
        'Natural Sweeteners',
        'hello@naturalsweeteners.com',
        '9876500008',
        NULL
    ),
    (
        'Cocoa World',
        'sales@cocoaworld.com',
        '9876500009',
        'Ahmedabad, Gujarat'
    ),
    (
        'Local Bakery Supplies',
        NULL,
        NULL,
        NULL
    );


-- =========================================================
-- 5. PRODUCTS
-- =========================================================

INSERT INTO product
    (name, description, price, category_id, supplier_id, is_active)
VALUES
    (
        'Chocolate Cake',
        'Rich chocolate cake with chocolate frosting',
        550.00,
        1,
        1,
        TRUE
    ),
    (
        'Butter Croissant',
        'Classic French-style butter croissant',
        120.00,
        2,
        2,
        TRUE
    ),
    (
        'Sourdough Bread',
        'Freshly baked sourdough bread',
        180.00,
        3,
        3,
        TRUE
    ),
    (
        'Butter Cookies',
        'Crunchy butter cookies',
        250.00,
        4,
        4,
        TRUE
    ),
    (
        'Red Velvet Cake',
        'Classic red velvet cake with cream cheese frosting',
        650.00,
        1,
        1,
        FALSE
    ),
    (
        'Blueberry Muffin',
        'Soft muffin with fresh blueberries',
        150.00,
        6,
        5,
        TRUE
    ),
    (
        'Glazed Donut',
        'Classic sugar-glazed donut',
        80.00,
        5,
        6,
        TRUE
    ),
    (
        'Cinnamon Bun',
        'Soft cinnamon bun suitable as a bakery snack',
        140.00,
        8,
        7,
        TRUE
    ),
    (
        'Chocolate Brownie',
        'Dense chocolate brownie',
        180.00,
        7,
        9,
        TRUE
    ),
    (
        'Apple Tart',
        'Apple tart with a buttery crust',
        300.00,
        2,
        10,
        TRUE
    );


-- =========================================================
-- 6. INVENTORY
-- =========================================================

INSERT INTO inventory
    (product_id, quantity, minimum_stock)
VALUES
    (1, 25, 10),
    (2, 40, 15),
    (3, 5, 10),
    (4, 0, 5),
    (5, 12, 5),
    (6, 50, 20),
    (7, 8, 10),
    (8, 30, 10),
    (9, 3, 10),
    (10, 100, 25);


-- =========================================================
-- 7. PRODUCT IMAGES
-- =========================================================
-- One image for each product.
--
-- Actual files:
-- src/main/resources/static/images/products/

INSERT INTO product_image
    (product_id, image_path, is_active)
VALUES
    (1, '/images/products/chocolate-cake.jpg', TRUE),
    (2, '/images/products/butter-croissant.jpg', TRUE),
    (3, '/images/products/sourdough-bread.jpg', TRUE),
    (4, '/images/products/butter-cookies.jpg', TRUE),
    (5, '/images/products/red-velvet-cake.jpg', TRUE),
    (6, '/images/products/blueberry-muffin.jpg', TRUE),
    (7, '/images/products/glazed-donut.jpg', TRUE),
    (8, '/images/products/cinnamon-bun.jpg', TRUE),
    (9, '/images/products/chocolate-brownie.jpg', TRUE),
    (10, '/images/products/apple-tart.jpg', TRUE);


-- =========================================================
-- 8. CUSTOMER ORDERS
-- =========================================================

INSERT INTO customer_order
    (
        user_id,
        contact,
        delivery_address,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at,
        updated_at
    )
VALUES
    (
        3,
        '9000000001',
        'Bangalore, Karnataka',
        1100.00,
        'UPI',
        'PAID',
        'DELIVERED',
        '2026-08-01 09:15:00',
        '2026-08-01 14:30:00'
    ),
    (
        4,
        '9000000002',
        'Mumbai, Maharashtra',
        600.00,
        'CARD',
        'PAID',
        'DELIVERED',
        '2026-08-02 10:00:00',
        '2026-08-02 16:00:00'
    ),
    (
        5,
        '9000000003',
        'Delhi, India',
        540.00,
        'UPI',
        'PAID',
        'PROCESSING',
        '2026-08-03 11:30:00',
        '2026-08-03 12:00:00'
    ),
    (
        6,
        '9000000004',
        'Pune, Maharashtra',
        250.00,
        'COD',
        'PENDING',
        'PLACED',
        '2026-08-04 13:00:00',
        '2026-08-04 13:00:00'
    ),
    (
        7,
        '9000000005',
        'Hyderabad, Telangana',
        300.00,
        'CARD',
        'PAID',
        'READY',
        '2026-08-05 09:00:00',
        '2026-08-05 11:00:00'
    ),
    (
        8,
        '9000000006',
        'Chandigarh, India',
        720.00,
        'UPI',
        'PAID',
        'DELIVERED',
        '2026-08-06 15:20:00',
        '2026-08-07 10:00:00'
    ),
    (
        9,
        '9000000007',
        'Chennai, Tamil Nadu',
        360.00,
        'CARD',
        'FAILED',
        'CANCELLED',
        '2026-08-07 12:30:00',
        '2026-08-07 12:35:00'
    ),
    (
        10,
        '9000000008',
        'Bangalore, Karnataka',
        900.00,
        'UPI',
        'PAID',
        'CONFIRMED',
        '2026-08-08 10:10:00',
        '2026-08-08 10:20:00'
    ),
    (
        3,
        '9000000001',
        'Bangalore, Karnataka',
        480.00,
        'COD',
        'PENDING',
        'PLACED',
        '2026-08-09 08:45:00',
        '2026-08-09 08:45:00'
    ),
    (
        4,
        '9000000002',
        'Mumbai, Maharashtra',
        840.00,
        'CARD',
        'PAID',
        'PROCESSING',
        '2026-08-10 09:30:00',
        '2026-08-10 09:45:00'
    );


-- =========================================================
-- 9. ORDER ITEMS
-- =========================================================

INSERT INTO order_item
    (order_id, product_id, quantity, unit_price, subtotal)
VALUES

    -- Order 1 = 1100
    (1, 1, 2, 550.00, 1100.00),

    -- Order 2 = 600
    (2, 2, 5, 120.00, 600.00),

    -- Order 3 = 540
    (3, 3, 1, 180.00, 180.00),
    (3, 6, 2, 150.00, 300.00),
    (3, 7, 1, 60.00, 60.00),

    -- Order 4 = 250
    (4, 4, 1, 250.00, 250.00),

    -- Order 5 = 300
    (5, 6, 2, 150.00, 300.00),

    -- Order 6 = 720
    (6, 8, 2, 140.00, 280.00),
    (6, 9, 2, 180.00, 360.00),
    (6, 7, 1, 80.00, 80.00),

    -- Order 7 = 360
    (7, 9, 2, 180.00, 360.00),

    -- Order 8 = 900
    (8, 1, 1, 550.00, 550.00),
    (8, 8, 2, 140.00, 280.00),
    (8, 7, 1, 70.00, 70.00),

    -- Order 9 = 480
    (9, 3, 1, 180.00, 180.00),
    (9, 4, 1, 250.00, 250.00),
    (9, 7, 1, 50.00, 50.00),

    -- Order 10 = 840
    (10, 1, 1, 550.00, 550.00),
    (10, 6, 1, 150.00, 150.00),
    (10, 8, 1, 140.00, 140.00);


-- =========================================================
-- 10. STOCK TRANSACTIONS
-- =========================================================

INSERT INTO stock_transaction
    (
        inventory_id,
        type,
        quantity,
        reason,
        reference_id,
        created_at
    )
VALUES

    -- -----------------------------------------------------
    -- Product 1: Chocolate Cake
    -- Final inventory = 40 - 10 - 5 = 25
    -- -----------------------------------------------------

    (
        1,
        'PURCHASE',
        40,
        'Initial stock received',
        NULL,
        '2026-07-25 09:00:00'
    ),
    (
        1,
        'SALE',
        -10,
        'Stock sold through customer order',
        1,
        '2026-08-01 10:00:00'
    ),
    (
        1,
        'DAMAGE',
        -5,
        'Damaged during storage',
        NULL,
        '2026-08-02 17:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 2: Butter Croissant
    -- Final inventory = 60 - 20 = 40
    -- -----------------------------------------------------

    (
        2,
        'PURCHASE',
        60,
        'Fresh stock received',
        NULL,
        '2026-07-26 09:30:00'
    ),
    (
        2,
        'SALE',
        -20,
        'Stock sold through customer order',
        2,
        '2026-08-02 11:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 3: Sourdough Bread
    -- Final inventory = 20 - 10 - 5 = 5
    -- -----------------------------------------------------

    (
        3,
        'PURCHASE',
        20,
        'Morning production batch',
        NULL,
        '2026-08-01 06:00:00'
    ),
    (
        3,
        'SALE',
        -10,
        'Stock sold',
        3,
        '2026-08-03 14:00:00'
    ),
    (
        3,
        'DAMAGE',
        -5,
        'Bread damaged during handling',
        NULL,
        '2026-08-04 18:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 4: Butter Cookies
    -- Final inventory = 30 - 25 - 5 = 0
    -- -----------------------------------------------------

    (
        4,
        'PURCHASE',
        30,
        'Initial stock received',
        NULL,
        '2026-07-28 10:00:00'
    ),
    (
        4,
        'SALE',
        -25,
        'Stock sold',
        4,
        '2026-08-04 14:00:00'
    ),
    (
        4,
        'DAMAGE',
        -5,
        'Damaged cookies',
        NULL,
        '2026-08-05 18:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 5: Red Velvet Cake
    -- Inactive product
    -- Final inventory = 20 - 8 = 12
    -- -----------------------------------------------------

    (
        5,
        'PURCHASE',
        20,
        'Stock received before product became inactive',
        NULL,
        '2026-07-20 09:00:00'
    ),
    (
        5,
        'SALE',
        -8,
        'Final sales before product became inactive',
        5,
        '2026-07-30 16:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 6: Blueberry Muffin
    -- Final inventory = 80 - 30 + 5 - 5 = 50
    -- -----------------------------------------------------

    (
        6,
        'PURCHASE',
        80,
        'Fresh stock received',
        NULL,
        '2026-08-01 07:00:00'
    ),
    (
        6,
        'SALE',
        -30,
        'Stock sold',
        6,
        '2026-08-06 16:00:00'
    ),
    (
        6,
        'RETURN',
        5,
        'Customer returned unopened muffins',
        6,
        '2026-08-07 11:00:00'
    ),
    (
        6,
        'ADJUSTMENT',
        -5,
        'Physical inventory count correction',
        NULL,
        '2026-08-07 15:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 7: Glazed Donut
    -- Final inventory = 15 - 7 = 8
    -- -----------------------------------------------------

    (
        7,
        'PURCHASE',
        15,
        'Fresh donut batch',
        NULL,
        '2026-08-05 06:00:00'
    ),
    (
        7,
        'SALE',
        -7,
        'Stock sold',
        8,
        '2026-08-08 12:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 8: Cinnamon Bun
    -- Final inventory = 50 - 20 = 30
    -- -----------------------------------------------------

    (
        8,
        'PURCHASE',
        50,
        'Fresh stock received',
        NULL,
        '2026-08-03 07:00:00'
    ),
    (
        8,
        'SALE',
        -20,
        'Stock sold',
        8,
        '2026-08-08 13:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 9: Chocolate Brownie
    -- Final inventory = 10 - 7 = 3
    -- -----------------------------------------------------

    (
        9,
        'PURCHASE',
        10,
        'Brownie batch produced',
        NULL,
        '2026-08-06 07:30:00'
    ),
    (
        9,
        'SALE',
        -7,
        'Stock sold',
        6,
        '2026-08-07 14:00:00'
    ),


    -- -----------------------------------------------------
    -- Product 10: Apple Tart
    -- Final inventory = 150 - 50 = 100
    -- -----------------------------------------------------

    (
        10,
        'PURCHASE',
        150,
        'Large production batch',
        NULL,
        '2026-08-08 06:30:00'
    ),
    (
        10,
        'SALE',
        -50,
        'Stock sold',
        10,
        '2026-08-10 12:00:00'
    );