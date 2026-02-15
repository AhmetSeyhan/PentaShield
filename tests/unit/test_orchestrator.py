"""Tests for the scan orchestrator."""

import pytest

from scanner.core.orchestrator import ScanOrchestrator
from scanner.models.enums import MediaType, Verdict


class TestScanOrchestrator:
    def test_media_type_detection(self):
        assert ScanOrchestrator._detect_media_type("test.mp4", None) == MediaType.VIDEO
        assert ScanOrchestrator._detect_media_type("test.jpg", None) == MediaType.IMAGE
        assert ScanOrchestrator._detect_media_type("test.wav", None) == MediaType.AUDIO
        assert ScanOrchestrator._detect_media_type("test.txt", None) == MediaType.TEXT

    def test_media_type_hint_override(self):
        assert ScanOrchestrator._detect_media_type("test.jpg", "video") == MediaType.VIDEO

    @pytest.mark.asyncio
    async def test_scan_no_detectors(self):
        orch = ScanOrchestrator()
        result = await orch.scan(b"fake image content", "test.jpg")
        assert result.scan_id.startswith("scn_")
        assert result.verdict == Verdict.UNCERTAIN
        assert result.processing_time_ms > 0

    @pytest.mark.asyncio
    async def test_scan_text(self):
        orch = ScanOrchestrator()
        text = b"This is some text content for analysis. " * 10
        result = await orch.scan(text, "test.txt")
        assert result.media_type == MediaType.TEXT

    @pytest.mark.asyncio
    async def test_cache_hit(self):
        orch = ScanOrchestrator()
        content = b"same content for cache test"
        # First scan
        r1 = await orch.scan(content, "test.jpg")
        # Second scan — should hit cache
        r2 = await orch.scan(content, "test.jpg")
        assert r2.scan_id == r1.scan_id  # cached result has same scan_id
