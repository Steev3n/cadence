from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import (
    InvalidTokenError,
    PyJWKClientConnectionError,
    PyJWKClientError,
)

from app.db import settings


issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1"
algorithm = settings.supabase_jwt_alg

if algorithm not in {"ES256", "RS256"}:
    raise RuntimeError("Configure an ES256 or RS256 Supabase signing key")

jwks = jwt.PyJWKClient(
    f"{issuer}/.well-known/jwks.json",
    cache_jwk_set=True,
    lifespan=300,
    timeout=5,
)

bearer = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer),
    ],
) -> UUID:
    unauthorized = HTTPException(
        status_code=401,
        detail="Invalid or missing access token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        token = credentials.credentials
        signing_key = jwks.get_signing_key_from_jwt(token)

        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=[algorithm],
            audience="authenticated",
            issuer=issuer,
            options={
                "require": ["exp", "iat", "sub", "iss", "aud"],
            },
        )

        if claims.get("role") != "authenticated":
            raise unauthorized

        return UUID(claims["sub"])

    except PyJWKClientConnectionError as exc:
        raise HTTPException(
            status_code=503,
            detail="Authentication service temporarily unavailable",
        ) from exc

    except (InvalidTokenError, PyJWKClientError, ValueError) as exc:
        raise unauthorized from exc


CurrentUserId = Annotated[UUID, Depends(get_current_user_id)]