"""Scanner SDK models."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any


class Verdict(str, Enum):
    """Detection verdict."""

    AUTHENTIC = "authentic"
    LIKELY_AUTHENTIC = "likely_authentic"
    UNCERTAIN = "uncertain"
    LIKELY_FAKE = "likely_fake"
    FAKE = "fake"


class MediaType(str, Enum):
    """Media type."""

    VIDEO = "video"
    IMAGE = "image"
    AUDIO = "audio"
    TEXT = "text"
    STREAM = "stream"


class ThreatLevel(str, Enum):
    """Threat level."""

    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ScanResult:
    """Scan result from Scanner API."""

    scan_id: str
    media_type: MediaType
    verdict: Verdict
    trust_score: float
    confidence: float
    threat_level: ThreatLevel
    detector_results: dict[str, Any]
    pentashield: dict[str, Any]
    attribution: dict[str, Any] | None
    explanation: dict[str, Any]
    processing_time_ms: float
    created_at: datetime

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ScanResult:
        """Create ScanResult from API response dict.

        Args:
            data: API response data

        Returns:
            ScanResult instance
        """
        return cls(
            scan_id=data["scan_id"],
            media_type=MediaType(data["media_type"]),
            verdict=Verdict(data["verdict"]),
            trust_score=data["trust_score"],
            confidence=data["confidence"],
            threat_level=ThreatLevel(data["threat_level"]),
            detector_results=data.get("detector_results", {}),
            pentashield=data.get("pentashield", {}),
            attribution=data.get("attribution"),
            explanation=data.get("explanation", {}),
            processing_time_ms=data.get("processing_time_ms", 0),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
        )


@dataclass
class HealthResponse:
    """Health check response."""

    status: str
    version: str
    environment: str
    detectors: list[dict[str, Any]]
    uptime_seconds: float

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> HealthResponse:
        """Create HealthResponse from API response dict."""
        return cls(
            status=data["status"],
            version=data["version"],
            environment=data["environment"],
            detectors=data.get("detectors", []),
            uptime_seconds=data.get("uptime_seconds", 0),
        )
