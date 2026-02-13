from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.dependencies import get_current_customer, require_admin

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/me", response_model=list[schemas.NotificationOut])
def my_notifications(current_customer=Depends(get_current_customer), db: Session = Depends(get_db)):
    return crud.list_notifications_for_customer(db, current_customer.customer_id)


@router.get("/customer/{customer_id}", response_model=list[schemas.NotificationOut])
def notifications_by_customer(customer_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return crud.list_notifications_for_customer(db, customer_id)
