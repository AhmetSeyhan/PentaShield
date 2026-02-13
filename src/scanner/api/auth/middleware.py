"""Scanner ULTRA — Authentication middleware."""

from __future__ import annotations

import hashlib
import logging

from fastapi import HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader

from scanner.config import get_settings

logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


async def verify_api_key(
    request: Request,
    api_key: str | None = Security(api_key_header),
) -> str:
    """Validate API key from header. Returns the key on success."""
    settings = get_settings()

    if settings.env == "development" and not api_key:
        return "dev-anonymous"

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide X-API-Key header.",
        )

    if _hash_key(api_key) != _hash_key(settings.api_key):
        logger.warning("Invalid API key attempt from %s", request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key.",
        )

    return api_key
