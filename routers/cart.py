from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.post("/add", response_model=schemas.CartItemOut, status_code=status.HTTP_201_CREATED)
def add_to_cart(payload: schemas.CartAdd, db: Session = Depends(get_db)):
    try:
        item = crud.add_to_cart(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not item:
        raise HTTPException(status_code=404, detail="Customer or product not found")
    return item


@router.get("/{customer_id}", response_model=list[schemas.CartItemOut])
def get_customer_cart(customer_id: int, db: Session = Depends(get_db)):
    return crud.get_cart_items(db, customer_id)


@router.put("/item/{cart_item_id}", response_model=schemas.CartItemOut)
def update_cart_item(cart_item_id: int, payload: schemas.CartItemUpdate, db: Session = Depends(get_db)):
    try:
        item = crud.update_cart_item(db, cart_item_id, payload.quantity)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return item


@router.delete("/item/{cart_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(cart_item_id: int, db: Session = Depends(get_db)):
    deleted = crud.remove_cart_item(db, cart_item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cart item not found")


@router.delete("/clear/{customer_id}")
def clear_customer_cart(customer_id: int, db: Session = Depends(get_db)):
    deleted_count = crud.clear_cart(db, customer_id)
    return {"deleted_items": deleted_count}
