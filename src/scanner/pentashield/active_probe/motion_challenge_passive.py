"""Scanner ULTRA — Motion challenge for liveness verification.

Analyzes motion consistency across frames. Real faces show coherent motion with
smooth flow, while deepfakes may exhibit jerky motion, inconsistent face-background
motion ratios, or temporal discontinuities.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import cv2
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class MotionChallengeResult:
    """Result of motion challenge analysis."""

    flow_consistency: float = 1.0
    face_bg_ratio: float = 1.0
    temporal_smoothness: float = 1.0
    overall_score: float = 1.0
    passed: bool = True


class MotionChallenge:
    """Evaluates motion consistency across frames."""

    MIN_FRAMES = 2  # Minimum frames for any motion analysis

    def evaluate(self, frames: list[np.ndarray] | None) -> MotionChallengeResult:
        """Evaluate motion consistency across video frames.

        Args:
            frames: List of RGB frames. If None or too few, returns default (passed).

        Returns:
            MotionChallengeResult with consistency scores
        """
        if not frames or len(frames) < self.MIN_FRAMES:
            logger.debug("Insufficient frames for motion challenge, returning default")
            return MotionChallengeResult()

        # Optical flow consistency
        flow_score = self._flow_consistency(frames)

        # Face-background motion ratio
        fb_ratio_score = self._face_bg_ratio(frames)

        # Temporal smoothness (jerk detection)
        smooth_score = self._temporal_smoothness(frames)

        # Overall score (weighted average)
        overall = 0.4 * flow_score + 0.3 * fb_ratio_score + 0.3 * smooth_score

        return MotionChallengeResult(
            flow_consistency=round(flow_score, 4),
            face_bg_ratio=round(fb_ratio_score, 4),
            temporal_smoothness=round(smooth_score, 4),
            overall_score=round(overall, 4),
            passed=overall >= 0.6,
        )

    @staticmethod
    def _flow_consistency(frames: list[np.ndarray]) -> float:
        """Compute optical flow consistency across frames.

        Args:
            frames: List of RGB frames

        Returns:
            Consistency score (0.0 - 1.0)
        """
        if len(frames) < 2:
            return 1.0

        # Compute optical flow for consecutive frame pairs
        flow_magnitudes = []
        for i in range(min(len(frames) - 1, 6)):  # Sample up to 6 pairs
            gray1 = cv2.cvtColor(frames[i], cv2.COLOR_RGB2GRAY)
            gray2 = cv2.cvtColor(frames[i + 1], cv2.COLOR_RGB2GRAY)

            # Farneback optical flow
            flow = cv2.calcOpticalFlowFarneback(
                gray1,
                gray2,
                None,
                pyr_scale=0.5,
                levels=3,
                winsize=15,
                iterations=3,
                poly_n=5,
                poly_sigma=1.2,
                flags=0,
            )

            # Flow magnitude
            magnitude = np.sqrt(flow[..., 0] ** 2 + flow[..., 1] ** 2)
            mean_mag = float(magnitude.mean())
            flow_magnitudes.append(mean_mag)

        if not flow_magnitudes:
            return 1.0

        # Consistency: low variance in flow magnitude = consistent motion
        mag_std = float(np.std(flow_magnitudes))
        mag_mean = float(np.mean(flow_magnitudes)) + 1e-8

        cv = mag_std / mag_mean

        # Score: low CV = high consistency
        score = max(0.0, 1.0 - cv)  # CV > 1 → score 0
        return min(1.0, score)

    @staticmethod
    def _face_bg_ratio(frames: list[np.ndarray]) -> float:
        """Check face vs background motion ratio.

        In deepfakes, face may move independently of background or vice versa.

        Args:
            frames: List of RGB frames

        Returns:
            Ratio score (0.0 - 1.0), 1.0 = consistent ratio
        """
        if len(frames) < 2:
            return 1.0

        ratios = []
        for i in range(min(len(frames) - 1, 4)):  # Sample up to 4 pairs
            gray1 = cv2.cvtColor(frames[i], cv2.COLOR_RGB2GRAY)
            gray2 = cv2.cvtColor(frames[i + 1], cv2.COLOR_RGB2GRAY)

            # Optical flow
            flow = cv2.calcOpticalFlowFarneback(
                gray1,
                gray2,
                None,
                pyr_scale=0.5,
                levels=2,
                winsize=10,
                iterations=2,
                poly_n=5,
                poly_sigma=1.1,
                flags=0,
            )

            magnitude = np.sqrt(flow[..., 0] ** 2 + flow[..., 1] ** 2)

            # Face region (center crop)
            h, w = magnitude.shape
            cy, cx = h // 2, w // 2
            face_region = magnitude[
                max(0, cy - h // 4) : min(h, cy + h // 4),
                max(0, cx - w // 4) : min(w, cx + w // 4),
            ]

            # Background region (corners)
            corner_size = h // 6
            bg_regions = [
                magnitude[:corner_size, :corner_size],  # Top-left
                magnitude[:corner_size, -corner_size:],  # Top-right
                magnitude[-corner_size:, :corner_size],  # Bottom-left
                magnitude[-corner_size:, -corner_size:],  # Bottom-right
            ]

            face_motion = face_region.mean() + 1e-8
            bg_motion = float(np.mean([r.mean() for r in bg_regions])) + 1e-8

            ratio = face_motion / bg_motion
            ratios.append(ratio)

        if not ratios:
            return 1.0

        # Consistency: stable ratio = face and background move together
        ratio_std = float(np.std(ratios))
        ratio_mean = float(np.mean(ratios))

        cv = ratio_std / (ratio_mean + 1e-8)

        # Score: low CV = consistent ratio
        score = max(0.0, 1.0 - cv * 0.5)  # CV > 2 → score 0
        return min(1.0, score)

    @staticmethod
    def _temporal_smoothness(frames: list[np.ndarray]) -> float:
        """Check temporal smoothness (detect jerky motion / discontinuities).

        Args:
            frames: List of RGB frames

        Returns:
            Smoothness score (0.0 - 1.0)
        """
        if len(frames) < 3:
            return 1.0

        # Compute frame-to-frame differences
        diffs = []
        for i in range(min(len(frames) - 1, 6)):
            gray1 = cv2.cvtColor(frames[i], cv2.COLOR_RGB2GRAY)
            gray2 = cv2.cvtColor(frames[i + 1], cv2.COLOR_RGB2GRAY)

            diff = cv2.absdiff(gray1, gray2)
            mean_diff = float(diff.mean())
            diffs.append(mean_diff)

        if len(diffs) < 2:
            return 1.0

        # Compute "jerk" (second derivative of frame differences)
        jerks = []
        for i in range(len(diffs) - 1):
            jerk = abs(diffs[i + 1] - diffs[i])
            jerks.append(jerk)

        if not jerks:
            return 1.0

        # Smoothness: low jerk = smooth motion
        jerk_mean = float(np.mean(jerks))

        # Normalize jerk (typical values: 0-10 for smooth, >20 for jerky)
        normalized_jerk = jerk_mean / 20.0

        # Score: low jerk = high smoothness
        score = max(0.0, 1.0 - normalized_jerk)
        return min(1.0, score)
