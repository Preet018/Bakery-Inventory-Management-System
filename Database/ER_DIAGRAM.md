# Bakery Inventory Management System — ER Diagram

Entity–relationship model derived from [`db_bakery-inventory.sql`](./db_bakery-inventory.sql)
(MySQL, schema `bakery_inventory`). 14 tables covering authentication, catalogue,
inventory, ordering and payments.

---

## 1. Full ER Diagram

```mermaid
erDiagram
    role ||--o{ user_account : "grants"
    user_account ||--o{ otp_verification : "requests"
    user_account ||--o{ saved_address : "saves"
    user_account ||--o{ customer_order : "places"
    saved_address |o--o{ customer_order : "snapshotted into"

    category ||--o{ product : "classifies"
    supplier ||--o{ product : "supplies"
    product ||--o| inventory : "stocked as"
    product ||--o{ product_image : "pictured by"

    customer_order ||--|{ order_item : "contains"
    product ||--o{ order_item : "ordered as"
    customer_order ||--o| payment : "paid by"

    customer_order ||--o{ inventory_reservation : "holds"
    product ||--o{ inventory_reservation : "reserved as"

    inventory ||--o{ stock_transaction : "logs"
    customer_order |o--o{ stock_transaction : "triggers"

    role {
        int id PK "AUTO_INCREMENT"
        varchar_30 name UK "NOT NULL — ADMIN / INVENTORY_MANAGER / CUSTOMER"
    }

    user_account {
        int id PK "AUTO_INCREMENT"
        varchar_50 username UK "NOT NULL"
        varchar_255 password_hash "NOT NULL"
        varchar_150 email UK "NOT NULL"
        boolean email_verified "NOT NULL, DEFAULT FALSE"
        boolean is_active "NOT NULL, DEFAULT TRUE"
        int role_id FK "NOT NULL — RESTRICT on delete"
    }

    otp_verification {
        bigint id PK "AUTO_INCREMENT"
        int user_id FK "NOT NULL — CASCADE on delete"
        varchar_100 code_hash "NOT NULL"
        varchar_50 purpose "NOT NULL — CHECK: 4 purposes"
        datetime expires_at "NOT NULL"
        int attempts "NOT NULL, DEFAULT 0"
        datetime created_at "NOT NULL"
        datetime used_at "NULL until consumed"
    }

    saved_address {
        int id PK "AUTO_INCREMENT"
        int user_id FK "NOT NULL — CASCADE on delete"
        varchar_30 label "NOT NULL"
        varchar_255 address_line "NOT NULL"
        varchar_255 landmark "NULL"
        varchar_100 city "NOT NULL"
        varchar_100 state "NOT NULL"
        varchar_20 postal_code "NOT NULL"
        decimal_10_8 latitude "NOT NULL — CHECK -90..90"
        decimal_11_8 longitude "NOT NULL — CHECK -180..180"
        varchar_255 place_id "NULL — geocoder reference"
        boolean is_default "NOT NULL, DEFAULT FALSE"
        datetime created_at "NOT NULL, DEFAULT NOW"
        datetime updated_at "NOT NULL, ON UPDATE NOW"
    }

    category {
        int id PK "AUTO_INCREMENT"
        varchar_50 name UK "NOT NULL"
    }

    supplier {
        int id PK "AUTO_INCREMENT"
        varchar_100 name "NOT NULL"
        varchar_150 email "NULL"
        varchar_10 phone "NULL"
        varchar_255 address "NULL"
        boolean is_active "NOT NULL, DEFAULT TRUE"
    }

    product {
        int id PK "AUTO_INCREMENT"
        varchar_150 name "NOT NULL"
        text description "NULL"
        decimal_10_2 price "NOT NULL — CHECK >= 0"
        int category_id FK "NOT NULL — RESTRICT on delete"
        int supplier_id FK "NOT NULL — RESTRICT on delete"
        boolean is_active "NOT NULL, DEFAULT TRUE"
    }

    product_image {
        int id PK "AUTO_INCREMENT"
        int product_id FK "NOT NULL — CASCADE on delete"
        varchar_500 image_path "NOT NULL"
        boolean is_active "NOT NULL, DEFAULT TRUE"
    }

    inventory {
        int id PK "AUTO_INCREMENT"
        int product_id FK "NOT NULL, UNIQUE — one row per product"
        int quantity "NOT NULL, DEFAULT 0 — CHECK >= 0"
        int reserved_quantity "NOT NULL, DEFAULT 0 — CHECK 0 <= reserved <= quantity"
        int minimum_stock "NOT NULL, DEFAULT 0 — CHECK >= 0, low-stock threshold"
    }

    customer_order {
        int id PK "AUTO_INCREMENT"
        int user_id FK "NOT NULL — RESTRICT on delete"
        int saved_address_id FK "NULL — SET NULL on delete"
        varchar_20 contact "NOT NULL"
        varchar_255 delivery_address "NOT NULL — snapshot"
        varchar_255 delivery_landmark "NULL"
        varchar_100 delivery_city "NOT NULL"
        varchar_100 delivery_state "NOT NULL"
        varchar_20 delivery_postal_code "NOT NULL"
        decimal_10_8 delivery_latitude "NOT NULL — CHECK -90..90"
        decimal_11_8 delivery_longitude "NOT NULL — CHECK -180..180"
        varchar_255 delivery_place_id "NULL"
        decimal_10_2 total_amount "NOT NULL — CHECK >= 0"
        varchar_30 order_status "NOT NULL — CHECK: 7 statuses"
        datetime created_at "NOT NULL, DEFAULT NOW"
        datetime updated_at "NOT NULL, ON UPDATE NOW"
    }

    order_item {
        int id PK "AUTO_INCREMENT"
        int order_id FK "NOT NULL — CASCADE on delete"
        int product_id FK "NOT NULL — RESTRICT on delete"
        int quantity "NOT NULL — CHECK > 0"
        decimal_10_2 unit_price "NOT NULL — CHECK >= 0, price at order time"
        decimal_10_2 subtotal "NOT NULL — CHECK >= 0"
    }

    payment {
        int id PK "AUTO_INCREMENT"
        int order_id FK "NOT NULL, UNIQUE — one payment per order"
        varchar_30 payment_method "NOT NULL — CHECK: 3 methods"
        varchar_30 payment_status "NOT NULL — CHECK: 4 statuses"
        varchar_50 provider "NOT NULL — e.g. Razorpay"
        varchar_100 provider_order_id "NULL — INDEXED"
        varchar_100 provider_payment_id "NULL"
        varchar_255 provider_signature "NULL — gateway verification"
        decimal_10_2 amount "NOT NULL — CHECK >= 0"
        varchar_10 currency "NOT NULL, DEFAULT INR"
        datetime created_at "NOT NULL, DEFAULT NOW"
        datetime updated_at "NOT NULL, ON UPDATE NOW"
    }

    inventory_reservation {
        int id PK "AUTO_INCREMENT"
        int order_id FK "NOT NULL — RESTRICT on delete"
        int product_id FK "NOT NULL — RESTRICT on delete"
        int quantity "NOT NULL — CHECK > 0"
        datetime reserved_at "NOT NULL, DEFAULT NOW"
        datetime expires_at "NOT NULL — INDEXED with status"
        varchar_30 status "NOT NULL — CHECK: ACTIVE/CONVERTED/RELEASED/EXPIRED"
    }

    stock_transaction {
        int id PK "AUTO_INCREMENT"
        int inventory_id FK "NOT NULL — RESTRICT on delete"
        varchar_30 type "NOT NULL — CHECK: 6 types"
        int quantity "NOT NULL — CHECK <> 0, signed movement"
        varchar_255 reason "NULL"
        int order_id FK "NULL — set only for order-driven moves"
        datetime created_at "NOT NULL, DEFAULT NOW"
    }
```

---

## 2. Relationships at a Glance

| # | Parent | Child | Cardinality | FK column | ON DELETE | Notes |
|---|--------|-------|-------------|-----------|-----------|-------|
| 1 | `role` | `user_account` | 1 : N | `role_id` | RESTRICT | Every user has exactly one role |
| 2 | `user_account` | `otp_verification` | 1 : N | `user_id` | CASCADE | OTPs die with the user |
| 3 | `user_account` | `saved_address` | 1 : N | `user_id` | CASCADE | Address book |
| 4 | `user_account` | `customer_order` | 1 : N | `user_id` | RESTRICT | Orders block user deletion |
| 5 | `saved_address` | `customer_order` | 0..1 : N | `saved_address_id` | SET NULL | Optional link; address is also copied into the order |
| 6 | `category` | `product` | 1 : N | `category_id` | RESTRICT | |
| 7 | `supplier` | `product` | 1 : N | `supplier_id` | RESTRICT | |
| 8 | `product` | `inventory` | 1 : 1 | `product_id` (UNIQUE) | RESTRICT | One stock row per product |
| 9 | `product` | `product_image` | 1 : N | `product_id` | CASCADE | Images die with the product |
| 10 | `customer_order` | `order_item` | 1 : N | `order_id` | CASCADE | Order lines |
| 11 | `product` | `order_item` | 1 : N | `product_id` | RESTRICT | |
| 12 | `customer_order` | `payment` | 1 : 1 | `order_id` (UNIQUE) | RESTRICT | `uk_payment_order` enforces one payment per order |
| 13 | `customer_order` | `inventory_reservation` | 1 : N | `order_id` | RESTRICT | `UNIQUE (order_id, product_id)` — one reservation per product per order |
| 14 | `product` | `inventory_reservation` | 1 : N | `product_id` | RESTRICT | |
| 15 | `inventory` | `stock_transaction` | 1 : N | `inventory_id` | RESTRICT | Full stock movement ledger |
| 16 | `customer_order` | `stock_transaction` | 0..1 : N | `order_id` | RESTRICT | Nullable — manual adjustments have no order |

`product` ↔ `customer_order` is effectively a many-to-many resolved by the
`order_item` junction table (which carries its own attributes: quantity,
unit price and subtotal).

All foreign keys use `ON UPDATE CASCADE`, except `fk_order_saved_address`
(`ON UPDATE RESTRICT`).

---

## 3. Enumerated Values (CHECK constraints)

| Table.column | Allowed values |
|---|---|
| `otp_verification.purpose` | `EMAIL_VERIFICATION`, `ACCOUNT_DELETION`, `PASSWORD_RESET`, `ADMIN_INVENTORY_MANAGER_DELETION` |
| `customer_order.order_status` | `PENDING_PAYMENT`, `PLACED`, `CONFIRMED`, `PROCESSING`, `READY`, `DELIVERED`, `CANCELLED` |
| `payment.payment_method` | `NETBANKING`, `CREDIT_CARD`, `DEBIT_CARD` |
| `payment.payment_status` | `PENDING`, `PAID`, `FAILED`, `REQUIRES_REFUND` |
| `inventory_reservation.status` | `ACTIVE`, `CONVERTED`, `RELEASED`, `EXPIRED` |
| `stock_transaction.type` | `PURCHASE`, `SALE`, `SUPPLIER_RETURN`, `DAMAGE`, `ADJUSTMENT`, `CANCEL` |
| `role.name` (seeded) | `ADMIN`, `INVENTORY_MANAGER`, `CUSTOMER` |

---

## 4. Functional Grouping

```mermaid
flowchart LR
    subgraph AUTH["Identity & Access"]
        role --> user_account
        user_account --> otp_verification
        user_account --> saved_address
    end

    subgraph CAT["Catalogue"]
        category --> product
        supplier --> product
        product --> product_image
    end

    subgraph STOCK["Inventory"]
        product --> inventory
        inventory --> stock_transaction
        inventory_reservation
    end

    subgraph ORD["Ordering & Payments"]
        customer_order --> order_item
        customer_order --> payment
    end

    user_account --> customer_order
    saved_address -.-> customer_order
    product --> order_item
    customer_order --> inventory_reservation
    product --> inventory_reservation
    customer_order -.-> stock_transaction
```

---

## 5. Design Notes

- **Address snapshotting.** `customer_order` copies the full delivery address
  (line, city, state, postal code, lat/long, place id) instead of relying on
  `saved_address_id` alone. Editing or deleting a saved address therefore never
  rewrites the delivery details of a historical order — the FK just goes `NULL`.
- **Price snapshotting.** `order_item.unit_price` and `subtotal` freeze the price
  at order time, so later changes to `product.price` don't restate past orders.
- **Two-phase stock.** `inventory.quantity` is physical stock and
  `reserved_quantity` is the soft-held portion, guarded by
  `CHECK (reserved_quantity <= quantity)`. `inventory_reservation` rows hold
  stock for a pending order until `expires_at`; the index
  `idx_reservation_status_expires (status, expires_at)` supports the sweeper
  that expires stale holds.
- **Auditability.** `stock_transaction` is an append-only ledger of every stock
  movement, with a signed `quantity` (`CHECK (quantity <> 0)`) and an optional
  `order_id` linking sales and cancellations back to their order.
- **Soft deletes.** `user_account`, `supplier`, `product` and `product_image`
  carry `is_active` flags; combined with `ON DELETE RESTRICT` on the
  transactional paths, historical records stay intact.

---

## 6. Supporting Indexes

| Index | Table | Columns |
|---|---|---|
| `idx_reservation_status_expires` | `inventory_reservation` | `(status, expires_at)` |
| `idx_payment_provider_order` | `payment` | `(provider_order_id)` |
| `idx_customer_order_user_status` | `customer_order` | `(user_id, order_status)` |
