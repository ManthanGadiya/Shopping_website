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

### 7.1 Cart Stock Validation Rule
- Cart quantity cannot exceed product stock.
- Enforced in backend during:
  - `POST /cart/add`
  - `PUT /cart/item/{cart_item_id}`
- If requested quantity is higher than stock, API returns `400` with clear message.

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
  - `2` admins (admin1, admin2)
  - `15` customers minimum
  - `20` products minimum
  - expanded product types: Food, Toys, Grooming, Accessories, Medicine, Beds, Training, Hygiene, Healthcare, Travel
  - sample reviews
  - sample orders and payment receipts
- Run with:
  - `python -m utils.seed_data`
- Seed credentials:
  - Admin: `admin1` / `admin1234`
  - Admin: `admin2` / `admin5678`
  - Customers: `user1@example.com` ... `user15@example.com` with password `user1234`

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

## Frontend Plan (8 Steps)
1. Frontend foundation shell + backend health connection check
2. Customer authentication UI (register/login/logout + token handling)
3. Product catalog UI (list/search/filter + product details)
4. Cart UI (add/update/remove/clear)
5. Checkout + order history UI
6. Payment receipt UI (JSON view + PDF download link)
7. Admin dashboard UI (products, orders, payment status, reports)
8. Final polish and validation (responsive fixes, UX cleanup, end-to-end flow)

### Frontend Step 1 Completed
- Added static frontend entry page: `static/index.html`
- Added base styling: `static/css/style.css`
- Added frontend bootstrap script: `static/js/app.js`
- Added backend connectivity check in UI (`GET /`) and status indicator
- Configured FastAPI static serving:
  - `app.mount("/static", ...)`
- frontend entry route: `GET /app`

### Frontend Step 2 Completed (Customer Auth UI)
- Added customer register form in `static/index.html`
- Added customer login/logout controls in `static/index.html`
- Added profile panel with live `/customers/me` data
- Implemented auth logic in `static/js/app.js`:
  - `POST /customers/register`
  - `POST /customers/login`
  - token storage in `localStorage` (`customerToken`)
  - `GET /customers/me` with bearer token
  - logout and profile refresh handling
- Extended styles in `static/css/style.css` for forms/messages/profile box

### Frontend UI/UX Refactor (Reference-Matched)
- Refactored frontend layout to match provided UI style reference:
  - orange top navigation bar
  - brand header (`Khushi Pet Shop`)
  - search input in navbar
  - category chips + cart badge
  - hero banner section
  - featured products section with sort selector
- Added product catalog rendering in `static/js/app.js` using backend `GET /products/`
- Added client-side search, category filtering, and sorting
- Added add-to-cart from product cards using:
  - `GET /customers/me`
  - `POST /cart/add`
  - cart count badge update
- Kept Step 2 auth/register/profile panels integrated below catalog
- Content and theme aligned with the Online Pet Shop project context from `P1.pdf`

### Public Landing Behavior Updated
- Changed root route `GET /` to serve the frontend landing page (instead of JSON)
- Kept API health endpoint at `GET /health` for frontend/backend connectivity checks
- Added first-view auth CTAs for all users:
  - `Login` button in top navbar and hero area
  - `Sign Up` button in top navbar and hero area
- CTA buttons focus the relevant forms in the page (`login` / `register`)

### Guest-First UI Flow Applied
- Default page now shows public landing + `Login` and `Sign Up` forms for all visitors
- Moved support/profile/admin panels behind authenticated view (`member-zone`)
- Added frontend auth view toggling in `static/js/app.js`:
  - logged out: show guest auth section
  - logged in: show member/support/profile section
- Navbar/Hero `Login` and `Sign Up` buttons now force guest-auth view and focus the correct form

### Frontend Step 3 Completed (Product Catalog UI)
- Product list rendering from backend `GET /products/`
- Search box filtering by product name/type
- Category chip filtering
- Sort dropdown for featured / price / rating
- Add-to-cart action from each product card

### Frontend Step 4 Completed (Cart UI)
- Added cart drawer UI:
  - open from `Cart (n)` chip
  - close button + overlay close
- Integrated cart endpoints:
  - `GET /cart/{customer_id}` to show cart items
  - `PUT /cart/item/{cart_item_id}` to update quantity
  - `DELETE /cart/item/{cart_item_id}` to remove item
  - `DELETE /cart/clear/{customer_id}` to clear cart
- Added cart total calculation and live cart badge updates
- Enforced login-before-cart-open behavior

### Frontend Connection Fix Applied
- Added CORS middleware in `main.py` for localhost dev ports (`5500`, `8000`)
- Added CORS support for JetBrains/PyCharm static server origins (`63342`)
- Added CORS support for `Origin: null` (when frontend is opened via `file://`)
- Added dedicated health endpoint: `GET /health`
- Updated frontend health check to use `GET /health`
- Added backend URL input controls in UI:
  - Save custom API base URL
  - Retry connection check
- Added fallback backend URL `http://127.0.0.1:8000` when opening frontend as `file://`

### How To Run Without Connection Errors
1. Start backend:
   - `uvicorn main:app --reload`
2. Open frontend:
   - Preferred: `http://127.0.0.1:8000/app`
   - Or via separate frontend server (e.g. port `5500`) and set Backend URL in UI to `http://127.0.0.1:8000`

## Multi-Page Architecture Update

The project now includes a template-based multi-page frontend to match the full system structure (customer + admin pages) while preserving API-first backend design.

### Template Files Added
- `templates/base.html`
- `templates/index.html`
- `templates/product_detail.html`
- `templates/cart.html`
- `templates/checkout.html`
- `templates/orders.html`
- `templates/admin_products.html`
- `templates/admin_orders.html`

### UI Assets Added
- `static/css/site.css`
- `static/js/site.js`

### Template Page Routes Added (`main.py`)
- `/` -> Home page
- `/products/{product_id}` -> Product detail page
- `/cart-page` -> Cart page
- `/checkout-page` -> Checkout page
- `/orders-page` -> Customer orders page
- `/admin/products-page` -> Admin product management page
- `/admin/orders-page` -> Admin order management page

### Feature Coverage on Multi-Page UI
- Customer side:
  - browse/search/sort products
  - product detail + reviews
  - cart update/remove/clear
  - checkout + order confirmation view
  - my orders + receipt PDF links
- Admin side:
  - admin login
  - add/edit/delete products
  - view and update order delivery status

### Security Model
- Role and access checks are still backend-enforced with JWT.
- Admin actions require valid admin token and protected endpoints.
- Frontend visibility is convenience only, not security.

## Admin UI Upgrade (Implemented)

Added a dedicated admin dashboard page with meaningful management sections and live API integration.

### New Admin Route
- `/admin/dashboard` -> unified admin dashboard

### New Template
- `templates/admin_dashboard.html`

### Admin Dashboard Features
- Admin login/logout controls (token-based)
- KPI cards from reports:
  - total orders
  - total revenue
  - total items sold
  - receipts generated
- Inventory snapshot summary
- Product management (add/edit/delete)
- Order management (view + delivery status updates)
- Payment management:
  - list payments
  - update payment status
  - direct receipt PDF link per payment

### Navigation Update
- Main navbar `Admin` link now points to `/admin/dashboard`.

## Checklist Continuation (PDF Alignment)

Implemented additional PDF-required modules:

### Services Module
- Backend router: `routers/services.py`
- Endpoints:
  - `GET /services/`
  - `POST /services/` (admin)
  - `PUT /services/{service_id}` (admin)
  - `DELETE /services/{service_id}` (admin)
- Customer page: `/services-page`

### Guides / Blogs Module
- Backend router: `routers/articles.py`
- Endpoints:
  - `GET /articles/`
  - `POST /articles/` (admin)
  - `PUT /articles/{article_id}` (admin)
  - `DELETE /articles/{article_id}` (admin)
- Customer page: `/guides-page`

### Delivery Tracking
- Added tracking events model and API:
  - `GET /orders/{order_id}/tracking`
- Tracking events are created on:
  - order placement
  - delivery status updates

### Mock Email/SMS Notifications
- Added notifications model and router: `routers/notifications.py`
- Endpoints:
  - `GET /notifications/me` (customer)
  - `GET /notifications/customer/{customer_id}` (admin)
- Notifications are auto-created for:
  - order confirmation
  - receipt generation notice
  - delivery status updates
- These are **mock notifications only** (no external email/SMS provider).

### Seed Data Extended
- Seed script now also seeds:
  - services
  - guides/articles

### Frontend Fetch Debug Fix (Important)
- Added robust API base detection in `static/js/site.js`:
  - if app is not running on port `8000`, default backend URL becomes `http://127.0.0.1:8000`
  - supports custom backend URL via `localStorage`
- Added visible backend diagnostics in `templates/base.html` footer:
  - backend URL input
  - save backend URL button
  - real-time connection status (`/health`)
- Improved API error messages to clearly show when backend is unreachable or wrong URL is set.

If frontend shows `Failed to fetch`:
1. Ensure backend is running: `uvicorn main:app --reload`
2. Set Backend URL to `http://127.0.0.1:8000` in footer controls
3. Reload the page

