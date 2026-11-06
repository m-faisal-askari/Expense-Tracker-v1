import uuid
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.app.core.config import settings

security = HTTPBearer(auto_error=False)

def verify_token(token: str) -> Optional[dict]:
    if not token or token == "null" or token == "undefined":
        return None

    # 1. Check development/test token mode
    if token.startswith("dev-user-") or token.startswith("auth-tester-"):
        prefix = "dev-user-" if token.startswith("dev-user-") else "auth-tester-"
        user_id = token.replace(prefix, "")
        user_name = user_id.replace("-", " ").replace("_", " ").title()
        return {
            "sub": user_id,
            "email": f"{user_id}@freelancefinance.local",
            "name": user_name,
            "user_metadata": {
                "full_name": user_name,
                "email": f"{user_id}@freelancefinance.local"
            }
        }
    
    # 2. Try Supabase / App JWT decoding with HS256
    try:
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            return payload
    except Exception:
        pass
        
    # 3. Fallback unverified decode for external Supabase JWK / tokens
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        if "sub" in payload:
            return payload
    except Exception:
        pass
        
    return None

def get_current_user_claims(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    default_guest = {
        "user_id": "guest-freelancer-user",
        "email": "guest@freelancer.local",
        "full_name": "Guest Freelancer",
        "is_guest": True
    }
    if not credentials or not credentials.credentials:
        return default_guest
    
    token = credentials.credentials
    if token in ("null", "undefined", "guest"):
        return default_guest

    payload = verify_token(token)
    if not payload or "sub" not in payload:
        return default_guest
    
    user_id = str(payload["sub"])
    email = payload.get("email")
    metadata = payload.get("user_metadata") or {}
    full_name = metadata.get("full_name") or metadata.get("name") or payload.get("name")
    if not full_name and email and not email.endswith("@freelancer.local"):
        full_name = email.split("@")[0].replace(".", " ").replace("_", " ").title()

    return {
        "user_id": user_id,
        "email": email,
        "full_name": full_name,
        "is_guest": user_id == "guest-freelancer-user"
    }

def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    claims = get_current_user_claims(credentials)
    return claims["user_id"]
