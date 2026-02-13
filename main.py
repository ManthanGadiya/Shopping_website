# uvicorn main:app --reload
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import models
from database import Base, engine
from routers import admins, cart, customers, orders, payments, products, reports, reviews

Base.metadata.create_all(bind=engine)

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
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def health():
    return {"message": "Online Pet Shop backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend reachable"}


@app.get("/app")
def frontend_app():
    return FileResponse(Path("static") / "index.html")
