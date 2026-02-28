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

    registry = DetectorRegistry()
    await _register_all_detectors(registry)
    logger.info("Detector registry ready — %d detectors", len(registry.all_detectors()))

    yield

    # Shutdown
    logger.info("Shutting down Scanner ULTRA")
    await registry.shutdown_all()


async def _register_all_detectors(registry: DetectorRegistry) -> None:
    """Instantiate, register, and load all 19 detection engines concurrently."""
    import asyncio

    from scanner.core.audio.audio_ensemble import AudioEnsemble
    from scanner.core.audio.cqt_detector import CQTDetector
    from scanner.core.audio.ecapa_tdnn_detector import ECAPATDNNDetector
    from scanner.core.audio.mel_audio_detector import MelAudioDetector
    from scanner.core.audio.syncnet_detector import SyncNetDetector
    from scanner.core.audio.voice_clone_detector import VoiceCloneDetector
    from scanner.core.audio.wavlm_detector import WavLMDetector
    from scanner.core.text.ai_text_detector import AITextDetector
    from scanner.core.text.perplexity_detector import PerplexityDetector
    from scanner.core.text.stylometric_detector import StylometricDetector
    from scanner.core.visual.clip_detector import CLIPDetector
    from scanner.core.visual.diffusion_artifact_detector import DiffusionArtifactDetector
    from scanner.core.visual.efficientnet_detector import EfficientNetDetector
    from scanner.core.visual.frequency_detector import FrequencyDetector
    from scanner.core.visual.gan_artifact_detector import GANArtifactDetector
    from scanner.core.visual.gaze_detector import GazeDetector
    from scanner.core.visual.ppg_bio_detector import PPGBioDetector
    from scanner.core.visual.visual_ensemble import VisualEnsemble
    from scanner.core.visual.vit_detector import ViTDetector
    from scanner.core.visual.xception_detector import XceptionDetector

    detectors = [
        # Visual (10)
        CLIPDetector(),
        EfficientNetDetector(),
        XceptionDetector(),
        ViTDetector(),
        FrequencyDetector(),
        GANArtifactDetector(),
        DiffusionArtifactDetector(),
        PPGBioDetector(),
        GazeDetector(),
        VisualEnsemble(),
        # Audio (7 — +MelAudioDetector Colab trained)
        WavLMDetector(),
        ECAPATDNNDetector(),
        CQTDetector(),
        MelAudioDetector(),
        VoiceCloneDetector(),
        SyncNetDetector(),
        AudioEnsemble(),
        # Text (3)
        AITextDetector(),
        StylometricDetector(),
        PerplexityDetector(),
    ]

    for detector in detectors:
        registry.register(detector)

    # Load all models concurrently; failures are logged but don't block startup
    results = await asyncio.gather(
        *(d.ensure_loaded() for d in detectors),
        return_exceptions=True,
    )
    for detector, result in zip(detectors, results):
        if isinstance(result, Exception):
            logger.warning("Detector %s failed to load: %s", detector.name, result)


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
