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
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", "https://zdhhqbljyjeeddhnebuu.supabase.co")
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY", "")
    # Required only for Supabase projects still using legacy HS256 JWT signing.
    # Never fall back to a known development secret.
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET") or None
    DEV_AUTH_ENABLED: bool = os.getenv("DEV_AUTH_ENABLED", "False").lower() in ("true", "1", "yes")
    
    # Financial Configuration
    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "USD")
    SUPPORTED_CURRENCIES: List[str] = ["USD", "PKR", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "SGD"]
    
    # Public frontend origin allowed to call the backend. Additional origins
    # can be provided as a comma-separated CORS_ORIGINS environment variable.
    FRONTEND_URL: str = ""
    CORS_ORIGINS: str = ""

    @property
    def cors_origins(self) -> List[str]:
        origins = [
            origin.strip().rstrip("/")
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]
        if self.FRONTEND_URL:
            origins.insert(0, self.FRONTEND_URL.strip().rstrip("/"))
        return list(dict.fromkeys(origins))

settings = Settings()
