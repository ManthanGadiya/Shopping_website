# uvicorn main:app --reload
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import models
from database import Base, engine, ensure_runtime_schema
from routers import (
    admins,
    articles,
    cart,
    customers,
    notifications,
    orders,
    payments,
    products,
    reports,
    reviews,
    services,
)

Base.metadata.create_all(bind=engine)
ensure_runtime_schema()

app = FastAPI(title="Online Pet Shop API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "null",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:63342",
        "http://localhost:63342",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(admins.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(reports.router)
app.include_router(reviews.router)
app.include_router(services.router)
app.include_router(articles.router)
app.include_router(notifications.router)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# jjj
@app.get("/")
def homepage(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/products/{product_id}")
def product_detail_page(request: Request, product_id: int):
    return templates.TemplateResponse("product_detail.html", {"request": request, "product_id": product_id})


@app.get("/cart-page")
def cart_page(request: Request):
    return templates.TemplateResponse("cart.html", {"request": request})


@app.get("/checkout-page")
def checkout_page(request: Request):
    return templates.TemplateResponse("checkout.html", {"request": request})


@app.get("/orders-page")
def orders_page(request: Request):
    return templates.TemplateResponse("orders.html", {"request": request})


@app.get("/services-page")
def services_page(request: Request):
    return templates.TemplateResponse("services.html", {"request": request})


@app.get("/guides-page")
def guides_page(request: Request):
    return templates.TemplateResponse("guides.html", {"request": request})


@app.get("/admin/products-page")
def admin_products_page(request: Request):
    return templates.TemplateResponse("admin_products.html", {"request": request})


@app.get("/admin/orders-page")
def admin_orders_page(request: Request):
    return templates.TemplateResponse("admin_orders.html", {"request": request})


@app.get("/admin/dashboard")
def admin_dashboard_page(request: Request):
    return templates.TemplateResponse("admin_dashboard.html", {"request": request})


@app.get("/admin")
def admin_root():
    return RedirectResponse(url="/admin/dashboard", status_code=307)


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend reachable"}


@app.get("/app")
def frontend_app(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
