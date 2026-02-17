"""Scanner ULTRA — Light challenge for liveness verification.

Analyzes how lighting changes affect face appearance. Real faces show consistent
shadow, highlight, and skin tone changes. Deepfakes may exhibit inconsistencies.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import cv2
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class LightChallengeResult:
    """Result of light challenge analysis."""

    ambient_response_score: float = 1.0
    shadow_coherence: float = 1.0
    specular_response: float = 1.0
    overall_score: float = 1.0
    passed: bool = True


class LightChallenge:
    """Evaluates light-response consistency across frames."""

    MIN_FRAMES = 4  # Minimum frames to run full analysis

    def evaluate(self, frames: list[np.ndarray] | None) -> LightChallengeResult:
        """Evaluate light-response consistency across video frames.

        Args:
            frames: List of RGB frames. If None or too few, returns default (passed).

        Returns:
            LightChallengeResult with consistency scores
        """
        if not frames or len(frames) < 2:
            logger.debug("Insufficient frames for light challenge, returning default")
            return LightChallengeResult()

        # Ambient light response (brightness gradient across frames)
        ambient_score = self._ambient_response(frames)

        # Shadow coherence (shadow direction consistency)
        shadow_score = self._shadow_coherence(frames) if len(frames) >= self.MIN_FRAMES else 1.0

        # Specular response (eye highlight tracking)
        specular_score = self._specular_response(frames) if len(frames) >= self.MIN_FRAMES else 1.0

        # Overall score (weighted average)
        overall = 0.4 * ambient_score + 0.3 * shadow_score + 0.3 * specular_score

        return LightChallengeResult(
            ambient_response_score=round(ambient_score, 4),
            shadow_coherence=round(shadow_score, 4),
            specular_response=round(specular_score, 4),
            overall_score=round(overall, 4),
            passed=overall >= 0.6,
        )

    @staticmethod
    def _ambient_response(frames: list[np.ndarray]) -> float:
        """Analyze ambient light response (brightness gradient consistency).

        Args:
            frames: List of RGB frames

        Returns:
            Consistency score (0.0 - 1.0)
        """
        if len(frames) < 2:
            return 1.0

        # Compute mean brightness for each frame
        brightness_values = []
        for frame in frames[:8]:  # Sample up to 8 frames
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            brightness = float(gray.mean())
            brightness_values.append(brightness)

        # Compute brightness gradient (frame-to-frame change)
        gradients = []
        for i in range(len(brightness_values) - 1):
            grad = abs(brightness_values[i + 1] - brightness_values[i])
            gradients.append(grad)

        if not gradients:
            return 1.0

        # Consistency: low variance in gradients = consistent lighting
        grad_std = float(np.std(gradients))
        grad_mean = float(np.mean(gradients)) + 1e-8

        # Normalize: coefficient of variation
        cv = grad_std / grad_mean

        # Score: low CV = high consistency
        score = max(0.0, 1.0 - cv / 2.0)  # CV > 2 → score 0
        return min(1.0, score)

    @staticmethod
    def _shadow_coherence(frames: list[np.ndarray]) -> float:
        """Check shadow direction coherence across frames.

        Args:
            frames: List of RGB frames

        Returns:
            Coherence score (0.0 - 1.0)
        """
        if len(frames) < 4:
            return 1.0

        # For each frame, compute left/right brightness ratio (simplified shadow indicator)
        lr_ratios = []
        for frame in frames[:6]:
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            h, w = gray.shape
            left_half = gray[:, : w // 2]
            right_half = gray[:, w // 2 :]

            left_brightness = left_half.mean() + 1e-8
            right_brightness = right_half.mean() + 1e-8

            ratio = left_brightness / right_brightness
            lr_ratios.append(ratio)

        if not lr_ratios:
            return 1.0

        # Consistency: low variance in L/R ratio = stable shadow direction
        ratio_std = float(np.std(lr_ratios))
        ratio_mean = float(np.mean(lr_ratios))

        # Coefficient of variation
        cv = ratio_std / (ratio_mean + 1e-8)

        # Score: low CV = high coherence
        score = max(0.0, 1.0 - cv * 2.0)  # CV > 0.5 → score 0
        return min(1.0, score)

    @staticmethod
    def _specular_response(frames: list[np.ndarray]) -> float:
        """Track specular highlights (eye catchlights) for consistency.

        Args:
            frames: List of RGB frames

        Returns:
            Consistency score (0.0 - 1.0)
        """
        if len(frames) < 4:
            return 1.0

        # Detect bright spots (specular highlights) in center region (eye area)
        highlight_counts = []
        for frame in frames[:6]:
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            h, w = gray.shape

            # Center region (approximate eye area)
            cy, cx = h // 2, w // 2
            eye_region = gray[
                max(0, cy - h // 6) : min(h, cy + h // 6),
                max(0, cx - w // 4) : min(w, cx + w // 4),
            ]

            # Threshold for bright spots
            _, bright = cv2.threshold(eye_region, 200, 255, cv2.THRESH_BINARY)
            highlight_count = cv2.countNonZero(bright)
            highlight_counts.append(highlight_count)

        if not highlight_counts:
            return 1.0

        # Consistency: stable highlight count = stable specular response
        count_std = float(np.std(highlight_counts))
        count_mean = float(np.mean(highlight_counts)) + 1e-8

        cv = count_std / count_mean

        # Score: low CV = high consistency
        score = max(0.0, 1.0 - cv)  # CV > 1 → score 0
        return min(1.0, score)
