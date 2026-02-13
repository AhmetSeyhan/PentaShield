"""Scanner ULTRA — Health endpoint."""

from __future__ import annotations

import time

from fastapi import APIRouter

from scanner.config import get_settings
from scanner.models.registry import DetectorRegistry
from scanner.models.schemas import HealthResponse

router = APIRouter()

_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    settings = get_settings()
    registry = DetectorRegistry()
    return HealthResponse(
        status="ok",
        version=settings.version,
        environment=settings.env,
        detectors=registry.health_check_all(),
        uptime_seconds=round(time.time() - _start_time, 1),
    )
