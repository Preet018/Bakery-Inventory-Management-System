-- =========================================================
-- DATABASE
-- =========================================================

CREATE DATABASE bakery_inventory;

USE bakery_inventory;


-- =========================================================
-- 1. ROLE
-- =========================================================

CREATE TABLE role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);


-- =========================================================
-- 2. USER ACCOUNT
-- =========================================================

CREATE TABLE user_account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role_id INT NOT NULL,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES role(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =========================================================
-- 3. SAVED ADDRESS
-- =========================================================

CREATE TABLE saved_address (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    label VARCHAR(30) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,

    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,

    place_id VARCHAR(255),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_address_user
        FOREIGN KEY (user_id)
        REFERENCES user_account(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_saved_address_latitude
        CHECK (latitude >= -90 AND latitude <= 90),

    CONSTRAINT chk_saved_address_longitude
        CHECK (longitude >= -180 AND longitude <= 180)
);


-- =========================================================
-- 4. CATEGORY
-- =========================================================

CREATE TABLE category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);


-- =========================================================
-- 5. SUPPLIER
-- =========================================================

CREATE TABLE supplier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    address VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================================================
-- 6. PRODUCT
-- =========================================================

CREATE TABLE product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INT NOT NULL,
    supplier_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES category(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_product_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES supplier(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_product_price
        CHECK (price >= 0)
);


-- =========================================================
-- 7. INVENTORY
-- =========================================================

CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_inventory_reserved_quantity
        CHECK (reserved_quantity >= 0),

    CONSTRAINT chk_inventory_minimum_stock
        CHECK (minimum_stock >= 0),

    CONSTRAINT chk_inventory_reserved_not_greater_than_quantity
        CHECK (reserved_quantity <= quantity)
);


-- =========================================================
-- 8. CUSTOMER ORDER
-- =========================================================

CREATE TABLE customer_order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    saved_address_id INT,

    contact VARCHAR(20) NOT NULL,

    delivery_address VARCHAR(255) NOT NULL,
    delivery_landmark VARCHAR(255),
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(100) NOT NULL,
    delivery_postal_code VARCHAR(20) NOT NULL,

    delivery_latitude DECIMAL(10,8) NOT NULL,
    delivery_longitude DECIMAL(11,8) NOT NULL,
    delivery_place_id VARCHAR(255),

    total_amount DECIMAL(10,2) NOT NULL,
    order_status VARCHAR(30) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_user
        FOREIGN KEY (user_id)
        REFERENCES user_account(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_saved_address
        FOREIGN KEY (saved_address_id)
        REFERENCES saved_address(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    CONSTRAINT chk_order_delivery_latitude
        CHECK (
            delivery_latitude >= -90
            AND delivery_latitude <= 90
        ),

    CONSTRAINT chk_order_delivery_longitude
        CHECK (
            delivery_longitude >= -180
            AND delivery_longitude <= 180
        ),

    CONSTRAINT chk_order_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_order_status
        CHECK (
            order_status IN (
                'PLACED',
                'CONFIRMED',
                'PROCESSING',
                'READY',
                'DELIVERED',
                'CANCELLED'
            )
        )
);


-- =========================================================
-- 9. ORDER ITEM
-- =========================================================

CREATE TABLE order_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id)
        REFERENCES customer_order(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_item_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_order_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_item_unit_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_order_item_subtotal
        CHECK (subtotal >= 0)
);


-- =========================================================
-- 10. PAYMENT
-- =========================================================

CREATE TABLE payment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_order_id VARCHAR(100),
    provider_payment_id VARCHAR(100),
    provider_signature VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_payment_order
        UNIQUE (order_id),

    CONSTRAINT fk_payment_order
        FOREIGN KEY (order_id)
        REFERENCES customer_order(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_payment_method
        CHECK (
            payment_method IN (
                'UPI',
                'CREDIT_CARD',
                'DEBIT_CARD'
            )
        ),

    CONSTRAINT chk_payment_status
        CHECK (
            payment_status IN (
                'PENDING',
                'PAID',
                'FAILED'
            )
        )
);


-- =========================================================
-- 11. INVENTORY RESERVATION
-- =========================================================

CREATE TABLE inventory_reservation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    status VARCHAR(30) NOT NULL,

    CONSTRAINT uk_reservation_order_product
        UNIQUE (order_id, product_id),

    CONSTRAINT fk_reservation_order
        FOREIGN KEY (order_id)
        REFERENCES customer_order(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_reservation_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_reservation_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_reservation_status
        CHECK (
            status IN (
                'ACTIVE',
                'CONVERTED',
                'RELEASED'
            )
        )
);


-- =========================================================
-- 12. STOCK TRANSACTION
-- =========================================================

CREATE TABLE stock_transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255),
    order_id INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_transaction_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES inventory(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_stock_transaction_order
        FOREIGN KEY (order_id)
        REFERENCES customer_order(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_stock_transaction_type
        CHECK (
            type IN (
                'PURCHASE',
                'SALE',
                'SUPPLIER_RETURN',
                'DAMAGE',
                'ADJUSTMENT',
                'CANCEL'
            )
        ),

    CONSTRAINT chk_stock_transaction_quantity
        CHECK (quantity <> 0)
);


-- =========================================================
-- 13. PRODUCT IMAGE
-- =========================================================

CREATE TABLE product_image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_product_image_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- INITIAL ROLES
-- =========================================================

INSERT INTO role (name)
VALUES
    ('ADMIN'),
    ('INVENTORY_MANAGER'),
    ('CUSTOMER');