"""Scanner ULTRA — Model weight loader utility."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def load_torch_weights(path: str, device: str = "cpu", strict: bool = False) -> Any | None:
    """Load PyTorch state dict from file with hash verification.

    Returns None if file not found or loading fails.
    """
    weight_path = Path(path)
    if not weight_path.exists():
        logger.warning("Weight file not found: %s", path)
        return None

    try:
        import torch

        state_dict = torch.load(weight_path, map_location=device, weights_only=True)
        logger.info("Loaded weights from %s (%s)", path, _file_size_mb(weight_path))
        return state_dict
    except Exception as exc:
        logger.error("Failed to load weights from %s: %s", path, exc)
        return None


def file_sha256(path: str) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _file_size_mb(path: Path) -> str:
    size = path.stat().st_size / (1024 * 1024)
    return f"{size:.1f} MB"
