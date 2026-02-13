"""Scanner ULTRA — Pydantic v2 API schemas."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field

from scanner.models.enums import MediaType, ThreatLevel, Verdict


class DetectorResultSchema(BaseModel):
    """API-facing schema for a single detector result."""

    detector_name: str
    score: float = Field(ge=0.0, le=1.0, description="0=authentic, 1=fake")
    confidence: float = Field(ge=0.0, le=1.0)
    method: str = ""
    details: dict[str, Any] = {}
    processing_time_ms: float = 0


class ScanRequest(BaseModel):
    """Metadata sent alongside the uploaded file."""

    media_type: MediaType | None = None  # auto-detect if None
    options: dict[str, Any] = {}


class ScanResult(BaseModel):
    """Unified response for any scan."""

    scan_id: str
    media_type: MediaType
    verdict: Verdict
    trust_score: float = Field(ge=0.0, le=1.0, description="0=fake, 1=authentic")
    confidence: float = Field(ge=0.0, le=1.0)
    threat_level: ThreatLevel
    detector_results: dict[str, DetectorResultSchema] = {}
    pentashield: dict[str, Any] = {}
    attribution: dict[str, Any] | None = None
    explanation: dict[str, Any] = {}
    processing_time_ms: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class HealthResponse(BaseModel):
    """Response for /health endpoint."""

    status: str = "ok"
    version: str
    environment: str
    detectors: list[dict[str, Any]] = []
    uptime_seconds: float = 0


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
    detail: str = ""
    status_code: int = 500
