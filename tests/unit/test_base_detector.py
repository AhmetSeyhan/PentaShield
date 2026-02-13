"""Tests for BaseDetector."""

import numpy as np
import pytest

from scanner.core.base_detector import BaseDetector, DetectorInput, DetectorResult
from scanner.models.enums import DetectorCapability, DetectorStatus, DetectorType


class MockDetector(BaseDetector):
    """Concrete test detector."""

    @property
    def name(self) -> str:
        return "mock_detector"

    @property
    def detector_type(self) -> DetectorType:
        return DetectorType.VISUAL

    @property
    def capabilities(self):
        return {DetectorCapability.SINGLE_IMAGE}

    async def load_model(self):
        self.model = "loaded"

    async def _run_detection(self, inp: DetectorInput) -> DetectorResult:
        return DetectorResult(
            detector_name=self.name,
            detector_type=self.detector_type,
            score=0.8,
            confidence=0.95,
            method="mock_method",
        )

    def get_model_info(self) -> dict:
        return {"name": "mock", "params": 0}


class FailingDetector(BaseDetector):
    """Detector that always raises."""

    @property
    def name(self) -> str:
        return "failing_detector"

    @property
    def detector_type(self) -> DetectorType:
        return DetectorType.VISUAL

    @property
    def capabilities(self):
        return {DetectorCapability.SINGLE_IMAGE}

    async def load_model(self):
        pass

    async def _run_detection(self, inp: DetectorInput) -> DetectorResult:
        raise RuntimeError("Intentional failure")

    def get_model_info(self) -> dict:
        return {}


@pytest.mark.asyncio
async def test_detector_lifecycle():
    d = MockDetector()
    assert not d._loaded

    await d.ensure_loaded()
    assert d._loaded
    assert d.model == "loaded"


@pytest.mark.asyncio
async def test_detector_detect():
    d = MockDetector()
    inp = DetectorInput(image=np.zeros((224, 224, 3), dtype=np.uint8))
    result = await d.detect(inp)

    assert result.score == 0.8
    assert result.confidence == 0.95
    assert result.status == DetectorStatus.PASS
    assert result.processing_time_ms > 0


@pytest.mark.asyncio
async def test_detector_error_handling():
    d = FailingDetector()
    inp = DetectorInput()
    result = await d.detect(inp)

    assert result.status == DetectorStatus.ERROR
    assert result.score == 0.5
    assert result.confidence == 0.0
    assert "Intentional failure" in result.details["error"]


def test_detector_health_check():
    d = MockDetector()
    health = d.health_check()
    assert health["name"] == "mock_detector"
    assert health["loaded"] is False
    assert health["enabled"] is True


def test_detector_result_clamp():
    r = DetectorResult(
        detector_name="test",
        detector_type=DetectorType.VISUAL,
        score=1.5,
        confidence=-0.3,
    )
    assert r.score == 1.0
    assert r.confidence == 0.0


def test_detector_result_to_dict():
    r = DetectorResult(
        detector_name="test",
        detector_type=DetectorType.AUDIO,
        score=0.75,
        confidence=0.9,
        method="cqt",
    )
    d = r.to_dict()
    assert d["detector_name"] == "test"
    assert d["score"] == 0.75
    assert d["method"] == "cqt"


def test_detector_repr():
    d = MockDetector()
    r = repr(d)
    assert "mock_detector" in r
    assert "visual" in r
