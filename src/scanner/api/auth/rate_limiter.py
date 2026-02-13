"""Scanner ULTRA — Rate limiting."""

from __future__ import annotations

import logging

from scanner.config import get_settings

logger = logging.getLogger(__name__)

# Rate limiter is optional — requires slowapi + redis
_limiter = None


def get_limiter():
    """Return a slowapi Limiter instance, or None if unavailable."""
    global _limiter
    if _limiter is not None:
        return _limiter

    try:
        from slowapi import Limiter
        from slowapi.util import get_remote_address

        settings = get_settings()
        _limiter = Limiter(
            key_func=get_remote_address,
            default_limits=[f"{settings.rate_limit}/minute"],
            storage_uri=settings.redis_url,
        )
        return _limiter
    except ImportError:
        logger.info("slowapi not installed — rate limiting disabled")
        return None
    except Exception as exc:
        logger.warning("Rate limiter init failed: %s — disabled", exc)
        return None
