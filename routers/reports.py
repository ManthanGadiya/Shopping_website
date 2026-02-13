from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.dependencies import require_admin

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/sales-summary", response_model=schemas.SalesSummaryOut)
def sales_summary(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return crud.get_sales_summary(db)


@router.get("/inventory-summary", response_model=schemas.InventorySummaryOut)
def inventory_summary(
    low_stock_threshold: int = Query(default=5, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return crud.get_inventory_summary(db, low_stock_threshold=low_stock_threshold)


@router.get("/feedback-summary", response_model=schemas.FeedbackSummaryOut)
def feedback_summary(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return crud.get_feedback_summary(db)
