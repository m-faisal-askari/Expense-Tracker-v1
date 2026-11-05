import hashlib
import uuid
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import get_current_user_id
from backend.app.models.models import UserAccount, UserProfile, Category
from backend.app.schemas.schemas import (
    UserRegister, UserLogin, GoogleAuthRequest, AuthResponse,
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

def hash_password(password: str) -> str:
    salt = "freelance_secret_salt_2026"
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

def verify_password(plain_password: str, hashed: str) -> bool:
    return hash_password(plain_password) == hashed

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=30),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

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

@router.post("/register", response_model=AuthResponse)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower()
    existing = db.query(UserAccount).filter(UserAccount.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this email already exists.")

    new_user = UserAccount(
        email=email_clean,
        password_hash=hash_password(data.password),
        full_name=data.full_name or email_clean.split("@")[0],
        auth_provider="email"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize Profile & default categories
    profile = UserProfile(
        user_id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        base_currency=settings.DEFAULT_CURRENCY,
        fiscal_year_start=1,
        country="US"
    )
    db.add(profile)
    db.commit()
    seed_default_categories(db, new_user.id)

    token = create_jwt_token(new_user.id, new_user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name
    }

@router.post("/login", response_model=AuthResponse)
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower()
    user = db.query(UserAccount).filter(UserAccount.email == email_clean).first()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_jwt_token(user.id, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name
    }

@router.post("/google", response_model=AuthResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    # Support Google sign-in payload
    email = data.email or (f"google_user_{data.sub or uuid.uuid4().hex[:6]}@gmail.com")
    email_clean = email.strip().lower()

    user = db.query(UserAccount).filter(UserAccount.email == email_clean).first()
    if not user:
        user = UserAccount(
            email=email_clean,
            full_name=data.full_name or "Google User",
            auth_provider="google",
            provider_id=data.sub
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = UserProfile(
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            base_currency=settings.DEFAULT_CURRENCY,
            fiscal_year_start=1,
            country="US"
        )
        db.add(profile)
        db.commit()
        seed_default_categories(db, user.id)

    token = create_jwt_token(user.id, user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name
    }

@router.get("/me")
def get_current_user_info(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    return {
        "user_id": user_id,
        "is_authenticated": user_id != "guest-freelancer-user",
        "is_guest": user_id == "guest-freelancer-user",
        "email": user.email if user else (profile.email if profile else "guest@freelancer.local"),
        "full_name": profile.full_name if profile else "Freelancer",
        "base_currency": profile.base_currency if profile else settings.DEFAULT_CURRENCY
    }

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            full_name="Guest Freelancer" if user_id == "guest-freelancer-user" else "Independent Freelancer",
            email=f"{user_id}@freelancer.local" if "@" not in user_id else user_id,
            base_currency=settings.DEFAULT_CURRENCY,
            fiscal_year_start=1,
            country="US"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        seed_default_categories(db, user_id)
    return profile

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(data: UserProfileCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id, base_currency=settings.DEFAULT_CURRENCY)
        db.add(profile)
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    seed_default_categories(db, user_id)
    return profile
