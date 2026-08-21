-- =========================================================
-- DATABASE
-- =========================================================

CREATE DATABASE bakery_inventory;

USE bakery_inventory;


-- =========================================================
-- 1. ROLE
-- =========================================================

CREATE TABLE Role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);


-- =========================================================
-- 2. USER ACCOUNT
-- =========================================================

CREATE TABLE User_Account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    address VARCHAR(255),
    role_id INT NOT NULL,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES Role(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =========================================================
-- 3. CATEGORY
-- =========================================================

CREATE TABLE Category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);


-- =========================================================
-- 4. SUPPLIER
-- =========================================================

CREATE TABLE Supplier (
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

CREATE TABLE Product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INT NOT NULL,
    supplier_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES Category(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_product_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES Supplier(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_product_price
        CHECK (price >= 0)
);


-- =========================================================
-- 6. INVENTORY
-- =========================================================

CREATE TABLE Inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES Product(id)
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
-- 7. CUSTOMER ORDER
-- =========================================================

CREATE TABLE Customer_Order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact VARCHAR(20) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status VARCHAR(30) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_user
        FOREIGN KEY (user_id)
        REFERENCES User_Account(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

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
-- 8. ORDER ITEM
-- =========================================================

CREATE TABLE Order_Item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id)
        REFERENCES Customer_Order(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_item_product
        FOREIGN KEY (product_id)
        REFERENCES Product(id)
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
-- 9. PAYMENT
-- =========================================================

CREATE TABLE Payment (
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
        REFERENCES Customer_Order(id)
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
-- 10. INVENTORY RESERVATION
-- =========================================================

CREATE TABLE Inventory_Reservation (
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
        REFERENCES Customer_Order(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_reservation_product
        FOREIGN KEY (product_id)
        REFERENCES Product(id)
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
-- 11. STOCK TRANSACTION
-- =========================================================

CREATE TABLE Stock_Transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255),
    order_id INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_transaction_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES Inventory(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_stock_transaction_order
        FOREIGN KEY (order_id)
        REFERENCES Customer_Order(id)
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
-- 12. PRODUCT IMAGE
-- =========================================================

CREATE TABLE Product_Image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_product_image_product
        FOREIGN KEY (product_id)
        REFERENCES Product(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



-- =========================================================
-- INITIAL ROLES
-- =========================================================

INSERT INTO Role (name)
VALUES
    ('ADMIN'),
    ('INVENTORY_MANAGER'),
    ('CUSTOMER');