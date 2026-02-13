from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/checkout", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def checkout(payload: schemas.CheckoutRequest, db: Session = Depends(get_db)):
    order = crud.create_order_from_cart(db, payload.customer_id, payload.payment_method)
    if not order:
        raise HTTPException(
            status_code=400,
            detail="Checkout failed. Verify customer, cart items, and available stock.",
        )
    return order


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/customer/{customer_id}", response_model=list[schemas.OrderOut])
def list_customer_orders(customer_id: int, db: Session = Depends(get_db)):
    return crud.list_orders_for_customer(db, customer_id)


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_status(order_id: int, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = crud.update_order_status(
        db,
        order_id,
        payment_status=payload.payment_status,
        delivery_status=payload.delivery_status,
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
