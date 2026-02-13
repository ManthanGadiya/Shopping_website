from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import crud
import models
from database import get_db
from utils.auth import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_customer(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Customer:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    payload = decode_access_token(creds.credentials)
    if not payload or payload.get("role") != "customer" or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    customer = crud.get_customer(db, int(payload["sub"]))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def require_admin(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Admin:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    payload = decode_access_token(creds.credentials)
    if not payload or payload.get("role") != "admin" or "sub" not in payload:
        raise HTTPException(status_code=403, detail="Admin access required")

    admin = crud.get_admin(db, int(payload["sub"]))
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin
