from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.auth import create_access_token, decode_access_token

router = APIRouter(prefix="/customers", tags=["Customers"])
bearer_scheme = HTTPBearer(auto_error=False)


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

    token = create_access_token({"sub": str(customer.customer_id), "email": customer.email})
    return {"access_token": token, "token_type": "bearer", "customer": customer}


@router.get("/me", response_model=schemas.CustomerOut)
def get_me(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if not creds:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    payload = decode_access_token(creds.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    customer = crud.get_customer(db, int(payload["sub"]))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/", response_model=list[schemas.CustomerOut])
def list_all_customers(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return crud.list_customers(db, skip=skip, limit=limit)


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(customer_id: int, payload: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    customer = crud.update_customer(db, customer_id, payload)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_customer(db, customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
