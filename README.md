# Shopping Website Backend (Online Pet Shop)

This project now has the backend API foundation implemented based on `P1.pdf`, starting with the required backend endpoints.

## What Has Been Done

### 1. Project Backend Setup
- Created FastAPI app entry point in `main.py`
- Configured SQLAlchemy database/session setup in `database.py`
- Added auto table creation on app startup

### 2. Database Models Implemented
Implemented core entities in `models.py`:
- `Admin`
- `Customer`
- `Product`
- `CartItem`
- `Order`
- `OrderItem`
- `Payment`
- `Review`

These cover the main PDF workflow: products, cart, order placement, payment tracking, and reviews/ratings.

### 3. Schema Validation
Added request/response schemas in `schemas.py` for:
- Admin auth
- Customer auth/profile
- Products
- Cart operations
- Checkout and orders
- Payments and receipts
- Reports
- Reviews

### 4. CRUD / Business Logic
Implemented in `crud.py`:
- Admin create/login lookup
- Customer create/login/auth
- Product create/read/update/delete
- Add/update/remove/clear cart
- Checkout from cart into order + order items
- Stock validation and stock deduction on checkout
- Payment record creation on checkout (receipt generation only)
- Payment retrieval and payment status update (manual/admin)
- Receipt payload generation
- Order retrieval and status updates
- Admin all-orders listing
- Sales report summary
- Inventory report summary
- Feedback report summary
- Review creation and product rating recalculation

### 5. API Routers Implemented

#### Admins/Auth (`routers/admins.py`)
- `POST /admins/register`
- `POST /admins/login`
- `GET /admins/me` (Bearer token, admin role)

#### Customers/Auth (`routers/customers.py`)
- `POST /customers/register`
- `POST /customers/login`
- `GET /customers/me` (Bearer token)
- `GET /customers/`
- `GET /customers/{customer_id}`
- `PUT /customers/{customer_id}`
- `DELETE /customers/{customer_id}`

#### Products (`routers/products.py`)
- `POST /products/`
- `GET /products/`
- `GET /products/{product_id}`
- `PUT /products/{product_id}`
- `DELETE /products/{product_id}`

#### Cart (`routers/cart.py`)
- `POST /cart/add`
- `GET /cart/{customer_id}`
- `PUT /cart/item/{cart_item_id}`
- `DELETE /cart/item/{cart_item_id}`
- `DELETE /cart/clear/{customer_id}`

#### Orders (`routers/orders.py`)
- `POST /orders/checkout`
- `GET /orders/` (admin only)
- `GET /orders/{order_id}`
- `GET /orders/customer/{customer_id}`
- `PATCH /orders/{order_id}/status` (admin only)

#### Payments (`routers/payments.py`)
- `GET /payments/` (admin only)
- `GET /payments/{payment_id}` (admin only)
- `GET /payments/order/{order_id}` (admin only)
- `PATCH /payments/{payment_id}/status` (admin only)
- `GET /payments/{payment_id}/receipt`
- `GET /payments/{payment_id}/receipt/pdf` (download PDF receipt)

#### Reports (`routers/reports.py`)
- `GET /reports/sales-summary` (admin only)
- `GET /reports/inventory-summary` (admin only)
- `GET /reports/feedback-summary` (admin only)

#### Reviews (`routers/reviews.py`)
- `POST /reviews/`
- `GET /reviews/product/{product_id}`

### 6. Integration
- Included all routers in `main.py`
- Confirmed route registration and successful app import
- Added auth helper utilities in `utils/auth.py`:
  - PBKDF2 password hashing/verification
  - JWT access token creation and validation
- Added role-based dependencies in `utils/dependencies.py`:
  - `require_admin`
  - `get_current_customer`

### 7. Authorization Rules
- Product create/update/delete requires admin token
- Customer list/get/update/delete by id requires admin token
- `GET /orders/` and `PATCH /orders/{order_id}/status` require admin token
- payment management endpoints require admin token
- reports endpoints require admin token
- `GET /customers/me` requires customer token

### 8. Payment Design (College Project)
- No real payment gateway integration is used.
- At checkout, the system creates an order and stores a payment record with status `RECEIPT_GENERATED`.
- A receipt can be generated via `GET /payments/{payment_id}/receipt`.
- A PDF receipt can be downloaded via `GET /payments/{payment_id}/receipt/pdf`.
- The receipt clearly states that no actual transaction was processed.
- PDF generation is implemented in `utils/pdf_generator.py` and files are written to `receipts/`.

### 9. Seed Data Added
- Added `utils/seed_data.py`
- Seed script now creates a full demo dataset in `petshop.db`:
  - `1` admin
  - `10` customers (minimum)
  - `10` products (minimum)
  - sample reviews
  - sample orders and payment receipts
- Run with:
  - `python -m utils.seed_data`
- Seed credentials:
  - Admin: `admin1` / `admin1234`
  - Customers: `user1@example.com` ... `user10@example.com` with password `user1234`

### 10. Validation Completed
- Python compile check (`compileall`) for project files
- API smoke flow tested successfully:
  - admin login + `GET /admins/me`
  - customer register/login
  - authenticated `GET /customers/me`
  - customer blocked from admin-only endpoints (403)
  - admin access to admin-only endpoints
  - create product
  - add to cart
  - checkout
  - verify checkout `payment_status = RECEIPT_GENERATED`
  - fetch payment by order
  - generate payment receipt
  - download PDF receipt
  - run reports endpoints
  - fetch order
  - create review
  - list customer orders

## Current Status
Backend endpoint phase is completed for:
- Admin authentication and role-based access control
- Customer authentication and profile token flow
- Product management
- Cart management
- Order + receipt-only payment flow
- Payment and receipt module
- PDF receipt download support
- Admin reports module
- Product reviews

## Remaining Optional Improvements
- Unit/integration test suite with pytest
- Pagination/filtering enhancements for admin dashboards
