"""Scanner ULTRA v5.0.0 — FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from scanner.config import get_settings
from scanner.models.registry import DetectorRegistry

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    settings = get_settings()
    _configure_logging(settings)
    logger.info("Scanner ULTRA v%s starting (%s)", settings.version, settings.env)

    # Registry will be populated when detectors register themselves
    registry = DetectorRegistry()
    logger.info("Detector registry ready — %d detectors", len(registry.all_detectors()))

    yield

    # Shutdown
    logger.info("Shutting down Scanner ULTRA")
    await registry.shutdown_all()


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title="Scanner ULTRA",
        description="Advanced multi-modal deepfake detection — PentaShield Edition",
        version=settings.version,
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limiting (optional)
    _setup_rate_limiting(app)

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled error: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "internal_server_error", "detail": str(exc)},
        )

    # Root health
    @app.get("/", tags=["root"])
    async def root():
        return {
            "name": "Scanner ULTRA",
            "version": settings.version,
            "status": "operational",
        }

    # Mount v1 router
    from scanner.api.v1.router import v1_router

    app.include_router(v1_router)

    return app


def _setup_rate_limiting(app: FastAPI) -> None:
    try:
        from scanner.api.auth.rate_limiter import get_limiter

        limiter = get_limiter()
        if limiter is not None:
            from slowapi import _rate_limit_exceeded_handler
            from slowapi.errors import RateLimitExceeded

            app.state.limiter = limiter
            app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    except ImportError:
        pass


def _configure_logging(settings) -> None:
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


# Module-level app for uvicorn
app = create_app()


def run() -> None:
    """Entry point for `scanner` CLI command."""
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "scanner.main:app",
        host=settings.host,
        port=settings.port,
        reload=not settings.is_production,
    )
