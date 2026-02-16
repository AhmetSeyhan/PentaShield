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


class HydraResult(BaseModel):
    """HYDRA ENGINE output — adversarial-immune multi-head analysis."""

    adversarial_detected: bool = False
    purification_applied: bool = False
    head_verdicts: list[float] = []
    consensus_score: float = 0.5
    minority_report: dict[str, Any] | None = None
    robustness_score: float = 0.0


class SentinelResult(BaseModel):
    """ZERO-DAY SENTINEL output — OOD + physics + bio consistency."""

    ood_score: float = 0.0
    is_novel_type: bool = False
    physics_score: float = 1.0
    physics_anomalies: list[str] = []
    bio_consistency: float = 1.0
    anomaly_score: float = 0.0
    alert_level: str = "none"


class PentaShieldResult(BaseModel):
    """Combined PentaShield analysis result."""

    hydra: HydraResult = Field(default_factory=HydraResult)
    sentinel: SentinelResult = Field(default_factory=SentinelResult)
    override_verdict: Verdict | None = None
    override_reason: str | None = None
    processing_time_ms: float = 0.0


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
