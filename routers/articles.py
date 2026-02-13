from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.dependencies import require_admin

router = APIRouter(prefix="/articles", tags=["Articles"])


@router.get("/", response_model=list[schemas.ArticleOut])
def list_articles(db: Session = Depends(get_db)):
    return crud.list_articles(db)


@router.post("/", response_model=schemas.ArticleOut, status_code=status.HTTP_201_CREATED)
def create_article(payload: schemas.ArticleCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return crud.create_article(db, payload)


@router.put("/{article_id}", response_model=schemas.ArticleOut)
def update_article(
    article_id: int,
    payload: schemas.ArticleUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    obj = crud.update_article(db, article_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Article not found")
    return obj


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(article_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = crud.delete_article(db, article_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Article not found")
