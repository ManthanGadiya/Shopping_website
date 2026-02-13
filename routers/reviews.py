from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=schemas.ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(payload: schemas.ReviewCreate, db: Session = Depends(get_db)):
    review = crud.create_review(db, payload)
    if not review:
        raise HTTPException(status_code=404, detail="Customer or product not found")
    return review


@router.get("/product/{product_id}", response_model=list[schemas.ReviewOut])
def list_product_reviews(product_id: int, db: Session = Depends(get_db)):
    return crud.list_reviews_by_product(db, product_id)
