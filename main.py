# uvicorn main:app --reload
from fastapi import FastAPI

import models
from database import Base, engine
from routers import cart, customers, orders, products, reviews

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Online Pet Shop API")

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(reviews.router)


@app.get("/")
def health():
    return {"message": "Online Pet Shop backend is running"}
