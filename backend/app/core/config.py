import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Freelancer Financial Management Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./freelance_finance.db")
    
    # Supabase & Auth
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET", "super-secret-freelance-jwt-token-key-for-development")
    DEV_AUTH_ENABLED: bool = os.getenv("DEV_AUTH_ENABLED", "True").lower() in ("true", "1", "yes")
    
    # Financial Configuration
    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "USD")
    SUPPORTED_CURRENCIES: List[str] = ["USD", "PKR", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "SGD"]
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://patient-fern-1718.fly.dev"
    ]

settings = Settings()
