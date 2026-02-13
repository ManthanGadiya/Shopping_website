from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.dependencies import require_admin

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/", response_model=list[schemas.PaymentOut])
def list_all_payments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return crud.list_payments(db, skip=skip, limit=limit)


@router.get("/{payment_id}", response_model=schemas.PaymentOut)
def get_payment(payment_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    payment = crud.get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.get("/order/{order_id}", response_model=schemas.PaymentOut)
def get_payment_by_order(order_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    payment = crud.get_payment_by_order_id(db, order_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found for order")
    return payment


@router.patch("/{payment_id}/status", response_model=schemas.PaymentOut)
def update_payment_status(
    payment_id: int,
    payload: schemas.PaymentStatusUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    payment = crud.update_payment_status(db, payment_id, payload.status.upper())
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.get("/{payment_id}/receipt", response_model=schemas.PaymentReceiptOut)
def generate_receipt(payment_id: int, db: Session = Depends(get_db)):
    payment = crud.get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return crud.build_payment_receipt(db, payment)
