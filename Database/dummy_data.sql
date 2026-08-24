-- =========================================================
-- BAKERY INVENTORY MANAGEMENT SYSTEM
-- DUMMY DATA
-- =========================================================
-- CHANGE: Replaced the empty dummy_data.sql with a complete
--         seed dataset matching the CURRENT schema/entities.
--
-- IMPORTANT:
-- 1. ADMIN is intentionally NOT inserted here. AdminAccountInitializer
--    creates exactly one ADMIN from ADMIN_USERNAME / ADMIN_EMAIL /
--    ADMIN_PASSWORD environment variables.
-- 2. Dummy login password for seeded users: password
-- 3. Product image paths below match the 10 files in:
--      dummy_images/products/
--    Copy those files into the backend upload directory before testing
--    image-serving endpoints:
--      uploads/images/products/
-- 4. This script assumes the database schema has already been created.
-- =========================================================

USE bakery_inventory;


-- =========================================================
-- 1. USER ACCOUNTS
-- =========================================================
-- BCrypt hash for the dummy password: password

INSERT INTO user_account
    (id, username, password_hash, email, email_verified, is_active, role_id)
VALUES
    (1, 'inventory_manager',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'inventory.manager@bakery.test', TRUE, TRUE, 2),

    (2, 'inventory_pending',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'inventory.pending@bakery.test', FALSE, TRUE, 2),

    (3, 'preet',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'preet@bakery.test', TRUE, TRUE, 3),

    (4, 'rahul',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'rahul@bakery.test', TRUE, TRUE, 3),

    (5, 'ananya',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'ananya@bakery.test', TRUE, TRUE, 3),

    (6, 'rohit',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'rohit@bakery.test', FALSE, TRUE, 3),

    (7, 'neha',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'neha@bakery.test', TRUE, FALSE, 3),

    (8, 'simran',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'simran@bakery.test', TRUE, TRUE, 3),

    (9, 'vishal',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'vishal@bakery.test', TRUE, TRUE, 3);


-- =========================================================
-- 2. SAVED ADDRESSES
-- =========================================================
-- Includes:
-- - multiple addresses for one customer
-- - default/non-default addresses
-- - optional landmark
-- - optional place_id
-- - different Indian cities

INSERT INTO saved_address
    (id, user_id, label, address_line, landmark, city, state,
     postal_code, latitude, longitude, place_id, is_default,
     created_at, updated_at)
VALUES
    (1, 3, 'Home',
     '42, 5th Cross, Koramangala', 'Near Forum Mall',
     'Bengaluru', 'Karnataka', '560034',
     12.93519200, 77.62448000, 'ChIJdummyKoramangala', TRUE,
     '2026-08-01 09:00:00', '2026-08-01 09:00:00'),

    (2, 3, 'Work',
     '18, Residency Road', NULL,
     'Bengaluru', 'Karnataka', '560025',
     12.97189100, 77.59417000, NULL, FALSE,
     '2026-08-02 10:30:00', '2026-08-02 10:30:00'),

    (3, 4, 'Home',
     '14, Andheri East', 'Near Metro Station',
     'Mumbai', 'Maharashtra', '400069',
     19.11970000, 72.84680000, 'ChIJdummyAndheri', TRUE,
     '2026-08-03 11:00:00', '2026-08-03 11:00:00'),

    (4, 5, 'Home',
     '22, Vasant Kunj', NULL,
     'New Delhi', 'Delhi', '110070',
     28.52060000, 77.15880000, 'ChIJdummyVasantKunj', TRUE,
     '2026-08-04 12:00:00', '2026-08-04 12:00:00'),

    (5, 6, 'Home',
     '9, Sector 22', NULL,
     'Chandigarh', 'Chandigarh', '160022',
     30.74150000, 76.78210000, NULL, TRUE,
     '2026-08-05 13:00:00', '2026-08-05 13:00:00'),

    (6, 8, 'Home',
     '17, Baner Road', 'Near Pancard Club Road',
     'Pune', 'Maharashtra', '411045',
     18.55900000, 73.78680000, 'ChIJdummyBaner', TRUE,
     '2026-08-06 14:00:00', '2026-08-06 14:00:00'),

    (7, 9, 'Home',
     '31, Anna Nagar', NULL,
     'Chennai', 'Tamil Nadu', '600040',
     13.08780000, 80.20890000, 'ChIJdummyAnnaNagar', TRUE,
     '2026-08-07 15:00:00', '2026-08-07 15:00:00'),

    (8, 7, 'Home',
     '8, Hitech City Road', NULL,
     'Hyderabad', 'Telangana', '500081',
     17.44830000, 78.39150000, NULL, TRUE,
     '2026-08-08 16:00:00', '2026-08-08 16:00:00'),

    (9, 6, 'Work',
     '101, Industrial Area', 'Gate 2',
     'Chandigarh', 'Chandigarh', '160002',
     30.70460000, 76.80100000, 'ChIJdummyIndustrialArea', FALSE,
     '2026-08-09 17:00:00', '2026-08-09 17:00:00');


-- =========================================================
-- 3. CATEGORIES
-- =========================================================
-- Snacks intentionally has no product so the frontend can test
-- an empty category result.

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
-- 4. SUPPLIERS
-- =========================================================
-- Includes active/inactive suppliers and missing optional fields.

INSERT INTO supplier
    (id, name, email, phone, address, is_active)
VALUES
    (1, 'Fresh Ingredients Ltd.',
     'contact@freshingredients.test', '9876500001',
     'Bengaluru, Karnataka', TRUE),

    (2, 'BakePro Supplies',
     'sales@bakepro.test', '9876500002',
     'Mumbai, Maharashtra', TRUE),

    (3, 'Golden Grain Foods',
     'info@goldengrain.test', '9876500003',
     'Delhi, India', TRUE),

    (4, 'Sweet Source Pvt Ltd',
     NULL, '9876500004',
     'Pune, Maharashtra', TRUE),

    (5, 'DairyFresh Suppliers',
     'sales@dairyfresh.test', NULL,
     'Hyderabad, Telangana', TRUE),

    (6, 'Premium Flour Co.',
     NULL, NULL,
     'Chennai, Tamil Nadu', TRUE),

    (7, 'Bakers Choice',
     'support@bakerschoice.test', '9876500007',
     NULL, TRUE),

    (8, 'Legacy Bakery Supplies',
     'legacy@bakery.test', '9876500008',
     'Mysuru, Karnataka', FALSE);


-- =========================================================
-- 5. PRODUCTS
-- =========================================================
-- Product 5 is intentionally inactive.
-- Product 10 uses an active supplier but is priced at the higher end.

INSERT INTO product
    (id, name, description, price, category_id, supplier_id, is_active)
VALUES
    (1, 'Chocolate Cake',
     'Rich chocolate sponge cake with chocolate frosting.',
     550.00, 1, 1, TRUE),

    (2, 'Butter Croissant',
     'Flaky French-style butter croissant baked fresh daily.',
     120.00, 2, 2, TRUE),

    (3, 'Sourdough Bread',
     'Naturally fermented sourdough loaf with a crisp crust.',
     180.00, 3, 3, TRUE),

    (4, 'Butter Cookies',
     'Crisp, buttery cookies packed in a reusable box.',
     250.00, 4, 4, TRUE),

    (5, 'Red Velvet Cake',
     'Classic red velvet cake with cream cheese frosting.',
     650.00, 1, 1, FALSE),

    (6, 'Blueberry Muffin',
     'Soft vanilla muffin filled with blueberries.',
     150.00, 6, 5, TRUE),

    (7, 'Glazed Donut',
     'Soft ring donut finished with a classic sugar glaze.',
     80.00, 5, 6, TRUE),

    (8, 'Cinnamon Bun',
     'Soft cinnamon roll with brown sugar and cinnamon filling.',
     140.00, 7, 7, TRUE),

    (9, 'Chocolate Brownie',
     'Dense and fudgy dark chocolate brownie.',
     180.00, 7, 7, TRUE),

    (10, 'Apple Tart',
     'Buttery tart crust filled with cinnamon-spiced apples.',
     320.00, 2, 2, TRUE);


-- =========================================================
-- 6. INVENTORY
-- =========================================================
-- Edge cases intentionally included:
-- - product 4: zero stock
-- - product 3: below minimum stock
-- - product 7: low stock with an active reservation
-- - product 10: healthy stock
-- - product 5: inactive product still has inventory

INSERT INTO inventory
    (id, product_id, quantity, reserved_quantity, minimum_stock)
VALUES
    (1, 1, 18, 0, 8),
    (2, 2, 7, 2, 10),
    (3, 3, 4, 0, 10),
    (4, 4, 0, 0, 5),
    (5, 5, 12, 0, 5),
    (6, 6, 32, 0, 15),
    (7, 7, 6, 0, 8),
    (8, 8, 22, 0, 10),
    (9, 9, 2, 2, 5),
    (10, 10, 75, 2, 20);


-- =========================================================
-- 7. PRODUCT IMAGES
-- =========================================================
-- CHANGE: image_path values intentionally match the actual files
-- available in dummy_images/products/ inside the project archive.
--
-- Files:
-- apple-tart.jpg
-- blueberry-muffin.jpg
-- butter-cookies.jpg
-- butter-croissant.jpg
-- chocolate-brownie.jpg
-- chocolate-cake.jpg
-- cinnamon-bun.jpg
-- glazed-donut.jpg
-- red-velvet-cake.jpg
-- sourdough-bread.jpg

INSERT INTO product_image
    (id, product_id, image_path, is_active)
VALUES
    (1, 1, '/images/products/chocolate-cake.jpg', TRUE),
    (2, 2, '/images/products/butter-croissant.jpg', TRUE),
    (3, 3, '/images/products/sourdough-bread.jpg', TRUE),
    (4, 4, '/images/products/butter-cookies.jpg', TRUE),
    (5, 5, '/images/products/red-velvet-cake.jpg', TRUE),
    (6, 6, '/images/products/blueberry-muffin.jpg', TRUE),
    (7, 7, '/images/products/glazed-donut.jpg', TRUE),
    (8, 8, '/images/products/cinnamon-bun.jpg', TRUE),
    (9, 9, '/images/products/chocolate-brownie.jpg', FALSE),
    (10, 10, '/images/products/apple-tart.jpg', TRUE);


-- =========================================================
-- 8. CUSTOMER ORDERS
-- =========================================================
-- Order scenarios:
-- 1  DELIVERED   + PAID
-- 2  READY       + PAID
-- 3  PROCESSING  + PAID
-- 4  CONFIRMED   + PAID
-- 5  PLACED      + PENDING payment + ACTIVE reservation
-- 6  CANCELLED   + FAILED payment + RELEASED reservation
-- 7  DELIVERED   + PAID + multiple items
-- 8  PLACED      + PENDING + expired ACTIVE reservation
-- 9  CONFIRMED   + PAID
-- 10 CANCELLED   + PENDING payment + RELEASED reservation

INSERT INTO customer_order
    (id, user_id, saved_address_id, contact,
     delivery_address, delivery_landmark, delivery_city,
     delivery_state, delivery_postal_code,
     delivery_latitude, delivery_longitude, delivery_place_id,
     total_amount, order_status, created_at, updated_at)
VALUES
    (1, 3, 1, '9876543210',
     '42, 5th Cross, Koramangala', 'Near Forum Mall',
     'Bengaluru', 'Karnataka', '560034',
     12.93519200, 77.62448000, 'ChIJdummyKoramangala',
     1100.00, 'DELIVERED',
     '2026-08-01 10:00:00', '2026-08-03 18:30:00'),

    (2, 4, 3, '9876543211',
     '14, Andheri East', 'Near Metro Station',
     'Mumbai', 'Maharashtra', '400069',
     19.11970000, 72.84680000, 'ChIJdummyAndheri',
     600.00, 'READY',
     '2026-08-05 11:00:00', '2026-08-07 15:30:00'),

    (3, 5, 4, '9876543212',
     '22, Vasant Kunj', NULL,
     'New Delhi', 'Delhi', '110070',
     28.52060000, 77.15880000, 'ChIJdummyVasantKunj',
     450.00, 'PROCESSING',
     '2026-08-09 12:30:00', '2026-08-10 14:00:00'),

    (4, 8, 6, '9876543213',
     '17, Baner Road', 'Near Pancard Club Road',
     'Pune', 'Maharashtra', '411045',
     18.55900000, 73.78680000, 'ChIJdummyBaner',
     320.00, 'CONFIRMED',
     '2026-08-12 09:45:00', '2026-08-12 10:05:00'),

    (5, 9, 7, '9876543214',
     '31, Anna Nagar', NULL,
     'Chennai', 'Tamil Nadu', '600040',
     13.08780000, 80.20890000, 'ChIJdummyAnnaNagar',
     360.00, 'PLACED',
     '2026-08-24 15:00:00', '2026-08-24 15:00:00'),

    (6, 3, 2, '9876543210',
     '18, Residency Road', NULL,
     'Bengaluru', 'Karnataka', '560025',
     12.97189100, 77.59417000, NULL,
     250.00, 'CANCELLED',
     '2026-08-15 10:30:00', '2026-08-15 10:35:00'),

    (7, 4, 3, '9876543211',
     '14, Andheri East', 'Near Metro Station',
     'Mumbai', 'Maharashtra', '400069',
     19.11970000, 72.84680000, 'ChIJdummyAndheri',
     990.00, 'DELIVERED',
     '2026-08-16 13:00:00', '2026-08-18 17:00:00'),

    (8, 5, 4, '9876543212',
     '22, Vasant Kunj', NULL,
     'New Delhi', 'Delhi', '110070',
     28.52060000, 77.15880000, 'ChIJdummyVasantKunj',
     640.00, 'PLACED',
     '2026-08-23 11:00:00', '2026-08-23 11:00:00'),

    (9, 8, 9, '9876543213',
     '101, Industrial Area', 'Gate 2',
     'Chandigarh', 'Chandigarh', '160002',
     30.70460000, 76.80100000, 'ChIJdummyIndustrialArea',
     280.00, 'CONFIRMED',
     '2026-08-20 16:00:00', '2026-08-20 16:20:00'),

    (10, 9, 7, '9876543214',
     '31, Anna Nagar', NULL,
     'Chennai', 'Tamil Nadu', '600040',
     13.08780000, 80.20890000, 'ChIJdummyAnnaNagar',
     120.00, 'CANCELLED',
     '2026-08-21 09:00:00', '2026-08-21 09:05:00');


-- =========================================================
-- 9. ORDER ITEMS
-- =========================================================

INSERT INTO order_item
    (id, order_id, product_id, quantity, unit_price, subtotal)
VALUES
    -- Order 1 = 2 x Chocolate Cake = 1100
    (1, 1, 1, 2, 550.00, 1100.00),

    -- Order 2 = 5 x Butter Croissant = 600
    (2, 2, 2, 5, 120.00, 600.00),

    -- Order 3 = 3 x Blueberry Muffin = 450
    (3, 3, 6, 3, 150.00, 450.00),

    -- Order 4 = 1 x Apple Tart = 320
    (4, 4, 10, 1, 320.00, 320.00),

    -- Order 5 = 2 x Chocolate Brownie = 360
    (5, 5, 9, 2, 180.00, 360.00),

    -- Order 6 = 1 x Butter Cookies = 250
    (6, 6, 4, 1, 250.00, 250.00),

    -- Order 7 = 1 Chocolate Cake + 1 Apple Tart + 1 Butter Croissant
    -- = 550 + 320 + 120 = 990
    -- CHANGE: order total below intentionally reflects the actual items.
    (7, 7, 1, 1, 550.00, 550.00),
    (8, 7, 10, 1, 320.00, 320.00),
    (9, 7, 2, 1, 120.00, 120.00),

    -- Order 8 = 2 x Apple Tart = 640
    (10, 8, 10, 2, 320.00, 640.00),

    -- Order 9 = 2 x Cinnamon Bun = 280
    (11, 9, 8, 2, 140.00, 280.00),

    -- Order 10 = 1 x Butter Croissant = 120
    (12, 10, 2, 1, 120.00, 120.00);


-- =========================================================
-- 10. PAYMENTS
-- =========================================================
-- Dummy Razorpay identifiers are intentionally fake.
-- They are for frontend/database testing only.

INSERT INTO payment
    (id, order_id, payment_method, payment_status, provider,
     provider_order_id, provider_payment_id, provider_signature,
     amount, currency, created_at, updated_at)
VALUES
    (1, 1, 'UPI', 'PAID', 'RAZORPAY',
     'order_dummy_0001', 'pay_dummy_0001', 'signature_dummy_0001',
     1100.00, 'INR',
     '2026-08-01 10:00:30', '2026-08-01 10:02:00'),

    (2, 2, 'CREDIT_CARD', 'PAID', 'RAZORPAY',
     'order_dummy_0002', 'pay_dummy_0002', 'signature_dummy_0002',
     600.00, 'INR',
     '2026-08-05 11:00:30', '2026-08-05 11:03:00'),

    (3, 3, 'UPI', 'PAID', 'RAZORPAY',
     'order_dummy_0003', 'pay_dummy_0003', 'signature_dummy_0003',
     450.00, 'INR',
     '2026-08-09 12:30:30', '2026-08-09 12:32:00'),

    (4, 4, 'DEBIT_CARD', 'PAID', 'RAZORPAY',
     'order_dummy_0004', 'pay_dummy_0004', 'signature_dummy_0004',
     320.00, 'INR',
     '2026-08-12 09:45:30', '2026-08-12 09:47:00'),

    (5, 5, 'UPI', 'PENDING', 'RAZORPAY',
     'order_dummy_0005', NULL, NULL,
     360.00, 'INR',
     '2026-08-24 15:00:30', '2026-08-24 15:00:30'),

    (6, 6, 'CREDIT_CARD', 'FAILED', 'RAZORPAY',
     'order_dummy_0006', NULL, NULL,
     250.00, 'INR',
     '2026-08-15 10:30:30', '2026-08-15 10:35:00'),

    (7, 7, 'UPI', 'PAID', 'RAZORPAY',
     'order_dummy_0007', 'pay_dummy_0007', 'signature_dummy_0007',
     990.00, 'INR',
     '2026-08-16 13:00:30', '2026-08-16 13:02:00'),

    (8, 8, 'CREDIT_CARD', 'PENDING', 'RAZORPAY',
     'order_dummy_0008', NULL, NULL,
     640.00, 'INR',
     '2026-08-23 11:00:30', '2026-08-23 11:00:30'),

    (9, 9, 'DEBIT_CARD', 'PAID', 'RAZORPAY',
     'order_dummy_0009', 'pay_dummy_0009', 'signature_dummy_0009',
     280.00, 'INR',
     '2026-08-20 16:00:30', '2026-08-20 16:02:00'),

    (10, 10, 'UPI', 'PENDING', 'RAZORPAY',
     'order_dummy_0010', NULL, NULL,
     120.00, 'INR',
     '2026-08-21 09:00:30', '2026-08-21 09:00:30');


-- =========================================================
-- 11. INVENTORY RESERVATIONS
-- =========================================================
-- ACTIVE reservations increase inventory.reserved_quantity.
-- CONVERTED reservations correspond to paid/confirmed orders.
-- RELEASED reservations correspond to cancelled orders.
--
-- One ACTIVE reservation is intentionally expired so the scheduled
-- cleanup path can be tested.

INSERT INTO inventory_reservation
    (id, order_id, product_id, quantity,
     reserved_at, expires_at, status)
VALUES
    -- Order 1: paid -> converted
    (1, 1, 1, 2,
     '2026-08-01 10:00:15', '2026-08-01 10:02:15', 'CONVERTED'),

    -- Order 2: paid -> converted
    (2, 2, 2, 5,
     '2026-08-05 11:00:15', '2026-08-05 11:02:15', 'CONVERTED'),

    -- Order 3: paid -> converted
    (3, 3, 6, 3,
     '2026-08-09 12:30:15', '2026-08-09 12:32:15', 'CONVERTED'),

    -- Order 4: paid -> converted
    (4, 4, 10, 1,
     '2026-08-12 09:45:15', '2026-08-12 09:47:15', 'CONVERTED'),

    -- Order 5: still waiting for payment -> active reservation
    (5, 5, 9, 2,
     '2026-08-24 15:00:15', '2026-08-24 15:02:15', 'ACTIVE'),

    -- Order 6: payment failed -> released reservation
    (6, 6, 4, 1,
     '2026-08-15 10:30:15', '2026-08-15 10:32:15', 'RELEASED'),

    -- Order 7: paid -> converted
    (7, 7, 1, 1,
     '2026-08-16 13:00:15', '2026-08-16 13:02:15', 'CONVERTED'),
    (8, 7, 10, 1,
     '2026-08-16 13:00:16', '2026-08-16 13:02:16', 'CONVERTED'),
    (9, 7, 2, 1,
     '2026-08-16 13:00:17', '2026-08-16 13:02:17', 'CONVERTED'),

    -- Order 8: pending payment + intentionally expired ACTIVE reservation
    (10, 8, 10, 2,
     '2026-08-23 11:00:15', '2026-08-23 11:02:15', 'ACTIVE'),

    -- Order 9: paid -> converted
    (11, 9, 8, 2,
     '2026-08-20 16:00:15', '2026-08-20 16:02:15', 'CONVERTED'),

    -- Order 10: cancelled -> released
    (12, 10, 2, 1,
     '2026-08-21 09:00:15', '2026-08-21 09:02:15', 'RELEASED');


-- =========================================================
-- 12. STOCK TRANSACTIONS
-- =========================================================
-- Quantities are signed:
-- PURCHASE / positive adjustment / CANCEL return stock -> positive
-- SALE / DAMAGE / SUPPLIER_RETURN / negative adjustment -> negative
--
-- The transaction history is intentionally varied so the inventory
-- manager frontend has useful data to display.

INSERT INTO stock_transaction
    (id, inventory_id, type, quantity, reason, order_id, created_at)
VALUES
    -- Product 1: Chocolate Cake
    (1, 1, 'PURCHASE', 25, 'Initial stock received', NULL,
     '2026-07-28 08:00:00'),
    (2, 1, 'DAMAGE', -3, 'Two cakes damaged during storage', NULL,
     '2026-07-30 17:30:00'),
    (3, 1, 'SALE', -2, 'Customer order payment confirmed', 1,
     '2026-08-01 10:02:00'),
    (4, 1, 'SALE', -1, 'Customer order payment confirmed', 7,
     '2026-08-16 13:02:00'),
    (5, 1, 'ADJUSTMENT', -1, 'Physical stock count correction', NULL,
     '2026-08-18 18:00:00'),

    -- Product 2: Butter Croissant
    (6, 2, 'PURCHASE', 18, 'Morning bakery delivery', NULL,
     '2026-08-03 07:00:00'),
    (7, 2, 'SALE', -5, 'Customer order payment confirmed', 2,
     '2026-08-05 11:03:00'),
    (8, 2, 'DAMAGE', -2, 'Damaged during handling', NULL,
     '2026-08-06 18:00:00'),
    (9, 2, 'SALE', -1, 'Customer order payment confirmed', 7,
     '2026-08-16 13:02:00'),
    (10, 2, 'SUPPLIER_RETURN', -3, 'Returned stale packaging batch', NULL,
     '2026-08-19 14:00:00'),

    -- Product 3: Sourdough Bread - deliberately below minimum stock
    (11, 3, 'PURCHASE', 12, 'Fresh morning production', NULL,
     '2026-08-20 06:30:00'),
    (12, 3, 'DAMAGE', -2, 'Loaves damaged during transport', NULL,
     '2026-08-20 19:00:00'),
    (13, 3, 'ADJUSTMENT', -6, 'End-of-day stock correction', NULL,
     '2026-08-21 20:00:00'),

    -- Product 4: Butter Cookies - zero stock
    (14, 4, 'PURCHASE', 10, 'Initial cookie batch', NULL,
     '2026-08-10 08:00:00'),
    (15, 4, 'DAMAGE', -4, 'Packaging damage', NULL,
     '2026-08-11 17:00:00'),
    (16, 4, 'SUPPLIER_RETURN', -5, 'Returned defective batch', NULL,
     '2026-08-12 16:00:00'),
    (17, 4, 'ADJUSTMENT', -1, 'Final physical count correction', NULL,
     '2026-08-13 18:00:00'),

    -- Product 5: inactive Red Velvet Cake still has historical stock
    (18, 5, 'PURCHASE', 15, 'Stock received before product deactivation', NULL,
     '2026-07-20 09:00:00'),
    (19, 5, 'ADJUSTMENT', -3, 'Stock count correction after deactivation', NULL,
     '2026-08-05 18:00:00'),

    -- Product 6: Blueberry Muffin
    (20, 6, 'PURCHASE', 40, 'Fresh blueberry muffin batch', NULL,
     '2026-08-07 07:00:00'),
    (21, 6, 'SALE', -3, 'Customer order payment confirmed', 3,
     '2026-08-09 12:32:00'),
    (22, 6, 'DAMAGE', -5, 'Expired muffins removed', NULL,
     '2026-08-11 18:00:00'),

    -- Product 7: Glazed Donut - low stock with active reservation
    (23, 7, 'PURCHASE', 10, 'Fresh donut batch', NULL,
     '2026-08-22 06:00:00'),
    (24, 7, 'DAMAGE', -4, 'Unsold donuts removed at closing', NULL,
     '2026-08-22 20:00:00'),

    -- Product 8: Cinnamon Bun
    (25, 8, 'PURCHASE', 25, 'Fresh cinnamon bun batch', NULL,
     '2026-08-17 07:00:00'),
    (26, 8, 'SALE', -2, 'Customer order payment confirmed', 9,
     '2026-08-20 16:02:00'),
    (27, 8, 'DAMAGE', -1, 'Damaged product', NULL,
     '2026-08-21 19:00:00'),

    -- Product 9: Chocolate Brownie - low stock, active reservation
    (28, 9, 'PURCHASE', 8, 'Brownie production batch', NULL,
     '2026-08-23 07:00:00'),
    (29, 9, 'DAMAGE', -4, 'Brownies removed after quality check', NULL,
     '2026-08-23 18:00:00'),
    (30, 9, 'ADJUSTMENT', -2, 'Physical stock count correction', NULL,
     '2026-08-23 19:00:00'),

    -- Product 10: Apple Tart
    (31, 10, 'PURCHASE', 80, 'Large apple tart production batch', NULL,
     '2026-08-15 06:30:00'),
    (33, 10, 'SALE', -1, 'Customer order payment confirmed', 4,
     '2026-08-12 09:47:00'),
    (33, 10, 'SALE', -1, 'Customer order payment confirmed', 7,
     '2026-08-16 13:02:00'),
    (34, 10, 'ADJUSTMENT', -1, 'Physical stock count correction', NULL,
     '2026-08-20 19:00:00'),
    (35, 10, 'DAMAGE', -2, 'Tarts damaged during transport', NULL,
     '2026-08-21 17:00:00');


-- =========================================================
-- 13. OTP VERIFICATION
-- =========================================================
-- Intentionally NOT seeded.
-- OTP codes are generated dynamically by OtpService and stored as hashes.
-- Seeded users cover both verified and unverified account states without
-- introducing fake OTPs that cannot be meaningfully verified.


-- =========================================================
-- END OF DUMMY DATA
-- =========================================================