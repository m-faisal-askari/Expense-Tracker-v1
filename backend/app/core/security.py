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
    if token.startswith("dev-user-"):
        user_id = token.replace("dev-user-", "")
        return {"sub": user_id, "email": f"{user_id}@freelancefinance.local"}
    
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

def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    # If no token provided, return guest user so data can be accessed without forced login lock
    if not credentials or not credentials.credentials:
        return "guest-freelancer-user"
    
    token = credentials.credentials
    if token in ("null", "undefined", "guest"):
        return "guest-freelancer-user"

    payload = verify_token(token)
    if not payload or "sub" not in payload:
        # Fall back to guest instead of blocking
        return "guest-freelancer-user"
    
    return str(payload["sub"])
