"""Scanner ULTRA — Thread-safe detector registry."""

from __future__ import annotations

import logging
import threading
from typing import TYPE_CHECKING

from scanner.models.enums import DetectorCapability, DetectorType

if TYPE_CHECKING:
    from scanner.core.base_detector import BaseDetector

logger = logging.getLogger(__name__)


class DetectorRegistry:
    """Singleton registry for all detection engines."""

    _instance: DetectorRegistry | None = None
    _lock = threading.Lock()

    def __new__(cls) -> DetectorRegistry:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._detectors: dict[str, BaseDetector] = {}
        return cls._instance

    def register(self, detector: BaseDetector) -> None:
        """Register a detector instance."""
        self._detectors[detector.name] = detector
        logger.info("Registered detector: %s (%s)", detector.name, detector.detector_type.value)

    def unregister(self, name: str) -> None:
        self._detectors.pop(name, None)

    def get(self, name: str) -> BaseDetector | None:
        return self._detectors.get(name)

    def get_by_type(self, dtype: DetectorType) -> list[BaseDetector]:
        return [d for d in self._detectors.values() if d.detector_type == dtype and d.enabled]

    def get_by_capability(self, cap: DetectorCapability) -> list[BaseDetector]:
        return [d for d in self._detectors.values() if cap in d.capabilities and d.enabled]

    def get_enabled(self) -> list[BaseDetector]:
        return [d for d in self._detectors.values() if d.enabled]

    def all_detectors(self) -> list[BaseDetector]:
        return list(self._detectors.values())

    def health_check_all(self) -> list[dict]:
        return [d.health_check() for d in self._detectors.values()]

    async def shutdown_all(self) -> None:
        for d in self._detectors.values():
            await d.shutdown()

    @classmethod
    def reset(cls) -> None:
        """Reset singleton (for testing)."""
        with cls._lock:
            if cls._instance is not None:
                cls._instance._detectors.clear()
            cls._instance = None
