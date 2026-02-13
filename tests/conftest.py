"""Scanner ULTRA — Test fixtures."""

from __future__ import annotations

import os

import pytest

# Force test environment
os.environ["SCANNER_ENV"] = "test"
os.environ["SCANNER_SECRET_KEY"] = "test-secret"
os.environ["SCANNER_API_KEY"] = "test-api-key"


@pytest.fixture
def api_key() -> str:
    return "test-api-key"


@pytest.fixture
def app():
    """Create a fresh FastAPI app for testing."""
    from scanner.config import get_settings

    get_settings.cache_clear()

    from scanner.models.registry import DetectorRegistry

    DetectorRegistry.reset()

    from scanner.main import create_app

    return create_app()


@pytest.fixture
async def client(app):
    """Async httpx client for FastAPI testing."""
    import httpx

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
