"""
Supabase JWT Authentication dependency for FastAPI.

Provides two dependency variants:
- get_current_user: strictly requires a valid JWT (raises 401 on failure)
- get_current_user_optional: returns the authenticated user ID if a valid
  JWT is present, otherwise falls back to an anonymous placeholder so that
  endpoints remain usable from frontends that don't share the auth session.
"""

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import SUPABASE_JWT_SECRET

# auto_error=False lets the dependency return None instead of 403
security = HTTPBearer(auto_error=False)

ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
) -> str:
    """
    Strict auth: extracts and verifies the Supabase JWT.
    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    token = credentials.credentials

    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured",
        )

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str | None:
    """
    Optional auth: if a valid JWT is present, return the real user ID.
    Otherwise return None so the endpoint still works for unauthenticated
    callers (e.g. Build frontend on a different port).  Returning None
    (instead of a dummy UUID) avoids foreign-key violations when the
    projects table references auth.users.
    """
    if credentials is None:
        return None

    if not SUPABASE_JWT_SECRET:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        return user_id or None
    except JWTError:
        return None

