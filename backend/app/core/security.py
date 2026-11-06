from functools import lru_cache
from typing import Optional
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db

security = HTTPBearer(auto_error=False)
_ASYMMETRIC_ALGORITHMS = {"ES256", "RS256", "EdDSA"}


@lru_cache(maxsize=4)
def _jwk_client(jwks_url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=300, timeout=5)


def verify_token(token: str) -> Optional[dict]:
    """Verify a Supabase user access token; never trust decoded unsigned claims."""
    if not token:
        return None

    if settings.DEV_AUTH_ENABLED and (
        token.startswith("dev-user-") or token.startswith("auth-tester-")
    ):
        prefix = "dev-user-" if token.startswith("dev-user-") else "auth-tester-"
        user_id = token[len(prefix):]
        if not user_id:
            return None
        user_name = user_id.replace("-", " ").replace("_", " ").title()
        return {
            "sub": user_id,
            "email": f"{user_id}@freelancefinance.local",
            "name": user_name,
            "user_metadata": {"full_name": user_name},
            "role": "authenticated",
            "_dev_auth": True,
        }

    supabase_url = (settings.SUPABASE_URL or "").rstrip("/")
    if not supabase_url:
        return None
    issuer = f"{supabase_url}/auth/v1"

    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")

        if algorithm == "HS256":
            # For legacy Supabase projects, require the explicitly configured secret.
            # No built-in development key is accepted.
            if not settings.SUPABASE_JWT_SECRET:
                return None
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                issuer=issuer,
                audience="authenticated",
            )
        elif algorithm in _ASYMMETRIC_ALGORITHMS:
            jwks_url = f"{issuer}/.well-known/jwks.json"
            signing_key = _jwk_client(jwks_url).get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[algorithm],
                issuer=issuer,
                audience="authenticated",
            )
        else:
            return None
    except Exception:
        return None

    if payload.get("role") != "authenticated" or payload.get("is_anonymous"):
        return None
    if not payload.get("sub") or not payload.get("email"):
        return None
    return payload


def _resolve_user(payload: dict, db: Session) -> dict:
    """Map verified Supabase identities to one local account and preserve its data ID."""
    from backend.app.models.models import UserAccount

    subject = str(payload["sub"])
    try:
        UUID(subject)
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.")

    email = str(payload["email"]).strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token.")

    account = db.query(UserAccount).filter(UserAccount.provider_id == subject).first()
    if account is None:
        account = db.query(UserAccount).filter(UserAccount.email == email).first()

    app_metadata = payload.get("app_metadata") or {}
    providers = app_metadata.get("providers") or []
    provider = "google" if "google" in providers else app_metadata.get("provider", "email")
    if provider not in {"email", "google"}:
        provider = "supabase"
    metadata = payload.get("user_metadata") or {}
    full_name = metadata.get("full_name") or metadata.get("name") or payload.get("name")

    changed = False
    if account is None:
        account = UserAccount(
            id=subject,
            email=email,
            full_name=full_name,
            auth_provider=provider,
            provider_id=subject,
            password_hash=None,
        )
        db.add(account)
        changed = True
    else:
        if account.email != email:
            account.email = email
            changed = True
        if account.provider_id != subject:
            account.provider_id = subject
            changed = True
        if account.auth_provider != provider:
            account.auth_provider = provider
            changed = True
        # Supabase is now the only password authority; discard any legacy app hash
        # when that account is next used with a verified Supabase session.
        if account.password_hash is not None:
            account.password_hash = None
            changed = True
        if full_name and account.full_name != full_name:
            account.full_name = full_name
            changed = True

    if changed:
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This sign-in identity is already linked to another account.",
            )

    return {
        "user_id": account.id,
        "email": email,
        "full_name": full_name or account.full_name,
        "is_guest": False,
        "auth_provider": provider,
    }


def get_current_user_claims(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("_dev_auth"):
        user_id = str(payload["sub"])
        return {
            **payload,
            "user_id": user_id,
            "full_name": (payload.get("user_metadata") or {}).get("full_name") or payload.get("name"),
            "is_guest": False,
        }

    return {**payload, **_resolve_user(payload, db)}


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> str:
    return get_current_user_claims(credentials, db)["user_id"]
