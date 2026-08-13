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
    address VARCHAR(255),
    role_id INT NOT NULL,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES role(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =========================================================
-- 3. CATEGORY
-- =========================================================

CREATE TABLE category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);


-- =========================================================
-- 4. SUPPLIER
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
-- 5. PRODUCT
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
-- 6. INVENTORY
-- =========================================================

CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    quantity INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES product(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_inventory_minimum_stock
        CHECK (minimum_stock >= 0)
);


CREATE TABLE StockTransaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255),
    reference_id INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_transaction_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES Inventory(id)
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
-- 8. PRODUCT IMAGE
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
-- 9. CUSTOMER ORDER
-- =========================================================

CREATE TABLE customer_order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact VARCHAR(20) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    order_status VARCHAR(30) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_user
        FOREIGN KEY (user_id)
        REFERENCES user_account(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_order_total
        CHECK (total_amount >= 0)
);


-- =========================================================
-- 10. ORDER ITEM
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
-- INITIAL ROLES
-- =========================================================

INSERT INTO role (name)
VALUES
    ('ADMIN'),
    ('INVENTORY_MANAGER'),
    ('CUSTOMER');