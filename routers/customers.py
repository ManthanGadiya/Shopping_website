from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.auth import create_access_token
from utils.dependencies import get_current_customer, require_admin

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/register", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def register_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    customer = crud.create_customer(db, payload)
    if not customer:
        raise HTTPException(status_code=400, detail="Email already registered")
    return customer


@router.post("/login", response_model=schemas.Token)
def login_customer(payload: schemas.CustomerLogin, db: Session = Depends(get_db)):
    customer = crud.authenticate_customer(db, payload.email, payload.password)
    if not customer:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(customer.customer_id), "role": "customer", "email": customer.email})
    return {"access_token": token, "token_type": "bearer", "customer": customer}


@router.get("/me", response_model=schemas.CustomerOut)
def get_me(current_customer=Depends(get_current_customer)):
    return current_customer


@router.get("/", response_model=list[schemas.CustomerOut])
def list_all_customers(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return crud.list_customers(db, skip=skip, limit=limit)


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(
    customer_id: int,
    payload: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    customer = crud.update_customer(db, customer_id, payload)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    deleted = crud.delete_customer(db, customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
