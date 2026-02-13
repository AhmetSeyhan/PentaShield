"""Scanner ULTRA — Scan orchestrator.

10-step pipeline:
1. Media Router (detect type)
2. Preprocessing
3. Quality Adaptation
4. Hash DB Check (cache)
5. Core Detection (all detectors)
6. Fusion (trust score)
7. Explainability
8. Cache result
9. Report
10. Return

Full implementation in FAZ 1. This is the structural skeleton.
"""

from __future__ import annotations

import hashlib
import logging
import mimetypes
import time
import uuid

from scanner.models.enums import MediaType, ThreatLevel, Verdict
from scanner.models.registry import DetectorRegistry
from scanner.models.schemas import ScanResult

logger = logging.getLogger(__name__)


class ScanOrchestrator:
    """Main scan pipeline orchestrator."""

    def __init__(self) -> None:
        self.registry = DetectorRegistry()

    async def scan(
        self,
        content: bytes,
        filename: str,
        media_type_hint: str | None = None,
    ) -> ScanResult:
        """Run the full detection pipeline."""
        start = time.perf_counter()
        scan_id = f"scn_{uuid.uuid4().hex[:12]}"
        correlation_id = uuid.uuid4().hex

        logger.info("[%s] Scan started — file=%s size=%d", scan_id, filename, len(content))

        # Step 1: Media Router
        media_type = self._detect_media_type(filename, media_type_hint)
        logger.info("[%s] Media type: %s", scan_id, media_type.value)

        # Step 2-4: Preprocessing, quality, cache (stub)
        content_hash = hashlib.sha256(content).hexdigest()

        # Step 5: Core Detection — run all enabled detectors
        detectors = self.registry.get_enabled()
        detector_results = {}

        if not detectors:
            logger.warning("[%s] No detectors registered — returning uncertain", scan_id)

        # Step 6: Fusion — placeholder
        trust_score = 0.5
        verdict = Verdict.UNCERTAIN
        threat_level = ThreatLevel.LOW
        confidence = 0.0

        elapsed = (time.perf_counter() - start) * 1000

        result = ScanResult(
            scan_id=scan_id,
            media_type=media_type,
            verdict=verdict,
            trust_score=trust_score,
            confidence=confidence,
            threat_level=threat_level,
            detector_results=detector_results,
            pentashield={},
            explanation={
                "summary_en": "No detectors active — pipeline skeleton ready",
                "content_hash": content_hash,
                "correlation_id": correlation_id,
            },
            processing_time_ms=elapsed,
        )

        # Step 8: Cache result
        from scanner.api.v1.results import store_result
        store_result(scan_id, result.model_dump(mode="json"))

        logger.info("[%s] Scan complete — verdict=%s (%.0fms)", scan_id, verdict.value, elapsed)
        return result

    @staticmethod
    def _detect_media_type(filename: str, hint: str | None) -> MediaType:
        """Auto-detect media type from filename or hint."""
        if hint:
            try:
                return MediaType(hint)
            except ValueError:
                pass

        mime, _ = mimetypes.guess_type(filename)
        if mime:
            if mime.startswith("video/"):
                return MediaType.VIDEO
            if mime.startswith("image/"):
                return MediaType.IMAGE
            if mime.startswith("audio/"):
                return MediaType.AUDIO
            if mime.startswith("text/"):
                return MediaType.TEXT

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        ext_map = {
            "mp4": MediaType.VIDEO, "avi": MediaType.VIDEO, "mov": MediaType.VIDEO,
            "mkv": MediaType.VIDEO, "webm": MediaType.VIDEO,
            "jpg": MediaType.IMAGE, "jpeg": MediaType.IMAGE, "png": MediaType.IMAGE,
            "webp": MediaType.IMAGE, "bmp": MediaType.IMAGE,
            "mp3": MediaType.AUDIO, "wav": MediaType.AUDIO, "flac": MediaType.AUDIO,
            "ogg": MediaType.AUDIO,
            "txt": MediaType.TEXT, "md": MediaType.TEXT,
        }
        return ext_map.get(ext, MediaType.IMAGE)
