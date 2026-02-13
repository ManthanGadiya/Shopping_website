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
- Products
- Cart operations
- Checkout and orders
- Payment output
- Reviews

### 4. CRUD / Business Logic
Implemented in `crud.py`:
- Product create/read/update/delete
- Add/update/remove/clear cart
- Checkout from cart into order + order items
- Stock validation and stock deduction on checkout
- Payment record creation on checkout
- Order retrieval and status updates
- Review creation and product rating recalculation

### 5. API Routers Implemented

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
- `GET /orders/{order_id}`
- `GET /orders/customer/{customer_id}`
- `PATCH /orders/{order_id}/status`

#### Reviews (`routers/reviews.py`)
- `POST /reviews/`
- `GET /reviews/product/{product_id}`

### 6. Integration
- Included all routers in `main.py`
- Confirmed route registration and successful app import
- Added auth helper utilities in `utils/auth.py`:
  - PBKDF2 password hashing/verification
  - JWT access token creation and validation

### 7. Validation Completed
- Python compile check (`compileall`) for project files
- API smoke flow tested successfully:
  - customer register/login
  - authenticated `GET /customers/me`
  - customer update/get/list
  - create product
  - add to cart
  - checkout
  - fetch order
  - create review
  - list customer orders

## Current Status
Backend endpoint phase is completed for:
- Product management
- Cart management
- Order + payment flow
- Product reviews

## Suggested Next Backend Tasks
- Customer registration/login endpoints
- Admin authentication/authorization
- Reports endpoints (sales, inventory, feedback)
- Payment gateway integration (currently mocked as successful in checkout)
- Test suite (unit + API integration tests)
