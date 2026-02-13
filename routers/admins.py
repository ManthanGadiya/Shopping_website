from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.auth import create_access_token
from utils.dependencies import require_admin

router = APIRouter(prefix="/admins", tags=["Admins"])


@router.post("/register", response_model=schemas.AdminOut, status_code=status.HTTP_201_CREATED)
def register_admin(payload: schemas.AdminCreate, db: Session = Depends(get_db)):
    admin = crud.create_admin(db, payload)
    if not admin:
        raise HTTPException(status_code=400, detail="Admin username/email already exists")
    return admin


@router.post("/login", response_model=schemas.AdminToken)
def login_admin(payload: schemas.AdminLogin, db: Session = Depends(get_db)):
    admin = crud.authenticate_admin(
        db,
        password=payload.password,
        user_name=payload.user_name,
        email=str(payload.email) if payload.email else None,
    )
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin email/username or password")
    token = create_access_token({"sub": str(admin.admin_id), "role": "admin", "user_name": admin.user_name})
    return {"access_token": token, "token_type": "bearer", "admin": admin}


@router.get("/me", response_model=schemas.AdminOut)
def get_admin_profile(current_admin=Depends(require_admin)):
    return current_admin
