from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.dependencies import require_admin

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("/", response_model=list[schemas.ServiceOut])
def list_services(db: Session = Depends(get_db)):
    return crud.list_services(db)


@router.post("/", response_model=schemas.ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(payload: schemas.ServiceCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return crud.create_service(db, payload)


@router.put("/{service_id}", response_model=schemas.ServiceOut)
def update_service(
    service_id: int,
    payload: schemas.ServiceUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    obj = crud.update_service(db, service_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Service not found")
    return obj


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = crud.delete_service(db, service_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Service not found")
