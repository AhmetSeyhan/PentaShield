"""Tests for Pydantic schemas."""

from scanner.models.enums import MediaType, ThreatLevel, Verdict
from scanner.models.schemas import (
    DetectorResultSchema,
    ErrorResponse,
    HealthResponse,
    ScanResult,
)


def test_scan_result_creation():
    r = ScanResult(
        scan_id="scn_abc123",
        media_type=MediaType.VIDEO,
        verdict=Verdict.FAKE,
        trust_score=0.08,
        confidence=0.97,
        threat_level=ThreatLevel.CRITICAL,
    )
    assert r.scan_id == "scn_abc123"
    assert r.verdict == Verdict.FAKE
    assert r.trust_score == 0.08


def test_scan_result_serialization():
    r = ScanResult(
        scan_id="scn_test",
        media_type=MediaType.IMAGE,
        verdict=Verdict.AUTHENTIC,
        trust_score=0.95,
        confidence=0.99,
        threat_level=ThreatLevel.NONE,
    )
    d = r.model_dump(mode="json")
    assert d["verdict"] == "authentic"
    assert d["media_type"] == "image"


def test_detector_result_schema():
    d = DetectorResultSchema(
        detector_name="efficientnet",
        score=0.75,
        confidence=0.9,
        method="efficientnet_b4",
    )
    assert d.score == 0.75


def test_health_response():
    h = HealthResponse(version="5.0.0", environment="test")
    assert h.status == "ok"
    assert h.version == "5.0.0"


def test_error_response():
    e = ErrorResponse(error="not_found", detail="Scan not found", status_code=404)
    assert e.status_code == 404
