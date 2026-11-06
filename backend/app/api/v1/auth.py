from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import get_current_user_id, get_current_user_claims
from backend.app.models.models import UserAccount, UserProfile, Category
from backend.app.schemas.schemas import (
    UserProfileCreate, UserProfileResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

DEFAULT_EXPENSE_CATEGORIES = [
    ("Software & Subscriptions", "#6366f1", "Laptop", True),
    ("Hardware & Equipment", "#3b82f6", "Cpu", True),
    ("Internet & Utilities", "#06b6d4", "Wifi", True),
    ("Office Supplies & Workspace", "#10b981", "Home", True),
    ("Marketing & Advertising", "#f59e0b", "Megaphone", True),
    ("Travel & Transportation", "#ec4899", "Plane", True),
    ("Education & Training", "#8b5cf6", "BookOpen", True),
    ("Freelance Contractors", "#14b8a6", "Users", True),
    ("Professional & Legal Services", "#64748b", "FileText", True),
    ("Bank & Transaction Fees", "#ef4444", "CreditCard", True),
    ("Meals & Entertainment", "#f97316", "Coffee", False),
    ("Personal Living Expenses", "#94a3b8", "Heart", False),
    ("Miscellaneous", "#a855f7", "HelpCircle", True)
]

DEFAULT_INCOME_CATEGORIES = [
    ("Client Projects", "#10b981", "Briefcase"),
    ("Monthly Retainers", "#06b6d4", "Repeat"),
    ("Consulting & Advisory", "#3b82f6", "MessageSquare"),
    ("Marketplace Earnings", "#8b5cf6", "Globe"),
    ("Digital Products & Courses", "#f59e0b", "Package"),
    ("Other Income", "#64748b", "PlusCircle")
]

def seed_default_categories(db: Session, user_id: str):
    existing = db.query(Category).filter(Category.user_id == user_id).first()
    if existing:
        return
    
    for name, color, icon, deductible in DEFAULT_EXPENSE_CATEGORIES:
        db.add(Category(
            user_id=user_id,
            name=name,
            type="EXPENSE",
            is_tax_deductible=deductible,
            color=color,
            icon=icon,
            is_system=True
        ))
    for name, color, icon in DEFAULT_INCOME_CATEGORIES:
        db.add(Category(
            user_id=user_id,
            name=name,
            type="INCOME",
            is_tax_deductible=False,
            color=color,
            icon=icon,
            is_system=True
        ))
    db.commit()

@router.get("/me")
def get_current_user_info(claims: dict = Depends(get_current_user_claims), db: Session = Depends(get_db)):
    user_id = claims["user_id"]
    token_email = claims.get("email")
    token_name = claims.get("full_name")

    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    if not profile:
        profile = UserProfile(
            user_id=user_id,
            full_name=token_name or (user.full_name if user else "Independent Freelancer"),
            email=token_email or (user.email if user else f"{user_id}@freelancer.local"),
            base_currency=settings.DEFAULT_CURRENCY,
            fiscal_year_start=1,
            country="US"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        seed_default_categories(db, user_id)
    else:
        updated = False
        if token_email and (not profile.email or "@freelancer.local" in profile.email):
            profile.email = token_email
            updated = True
        if token_name and (not profile.full_name or profile.full_name in ("Independent Freelancer", "Guest Freelancer")):
            profile.full_name = token_name
            updated = True
        if updated:
            db.commit()
            db.refresh(profile)

    email = token_email or (user.email if user else (profile.email if profile else ""))
    full_name = token_name or (profile.full_name if profile else (user.full_name if user else "Freelancer"))

    return {
        "user_id": user_id,
        "is_authenticated": True,
        "is_guest": False,
        "email": email,
        "full_name": full_name,
        "base_currency": profile.base_currency if profile else settings.DEFAULT_CURRENCY
    }

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(claims: dict = Depends(get_current_user_claims), db: Session = Depends(get_db)):
    user_id = claims["user_id"]
    token_email = claims.get("email")
    token_name = claims.get("full_name")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            full_name=token_name or "Independent Freelancer",
            email=token_email or (f"{user_id}@freelancer.local" if "@" not in user_id else user_id),
            base_currency=settings.DEFAULT_CURRENCY,
            fiscal_year_start=1,
            country="US"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        seed_default_categories(db, user_id)
    else:
        updated = False
        if token_email and (not profile.email or "@freelancer.local" in profile.email):
            profile.email = token_email
            updated = True
        if token_name and (not profile.full_name or profile.full_name in ("Independent Freelancer", "Guest Freelancer")):
            profile.full_name = token_name
            updated = True
        if updated:
            db.commit()
            db.refresh(profile)

    return profile

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(data: UserProfileCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id, base_currency=settings.DEFAULT_CURRENCY)
        db.add(profile)
    
    for key, value in data.dict(exclude_unset=True).items():
        if key == "email":
            continue
        setattr(profile, key, value)
        
    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if user:
        if profile.full_name:
            user.full_name = profile.full_name
    db.commit()
    db.refresh(profile)
    seed_default_categories(db, user_id)
    return profile
