from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import Category
from backend.app.schemas.schemas import CategoryCreate, CategoryResponse
from backend.app.api.v1.auth import seed_default_categories

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(type: Optional[str] = None, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    seed_default_categories(db, user_id)
    query = db.query(Category).filter(Category.user_id == user_id)
    if type:
        query = query.filter(Category.type == type.upper())
    return query.order_by(Category.name.asc()).all()

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    category = Category(
        user_id=user_id,
        name=data.name,
        type=data.type.upper(),
        is_tax_deductible=data.is_tax_deductible,
        color=data.color,
        icon=data.icon,
        is_system=False
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    db.delete(cat)
    db.commit()
    return None
