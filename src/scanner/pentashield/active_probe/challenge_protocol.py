"""Scanner ULTRA — Challenge Protocol Engine.

Generates random, unpredictable challenges for active liveness verification.
Prevents deepfake systems from pre-generating responses.
"""

from __future__ import annotations

import random
import secrets
from dataclasses import dataclass
from typing import Any


@dataclass
class Challenge:
    """A single challenge for liveness verification."""

    challenge_id: str
    challenge_type: str
    instruction: str
    parameters: dict[str, Any]
    expected_duration_ms: int
    verification_criteria: dict[str, Any]


class ChallengeProtocol:
    """Generates unpredictable challenges for active probe."""

    # Light challenge colors (high contrast for reflection detection)
    LIGHT_COLORS = [
        "#FFFFFF",  # White
        "#000000",  # Black
        "#FF0000",  # Red
        "#00FF00",  # Green
        "#0000FF",  # Blue
    ]

    # Motion challenge directions
    MOTION_DIRECTIONS = [
        {"direction": "left", "instruction": "Başınızı SOLA çevirin", "angle": 30},
        {"direction": "right", "instruction": "Başınızı SAĞA çevirin", "angle": 30},
        {"direction": "up", "instruction": "Başınızı YUKARI kaldırın", "angle": 25},
        {"direction": "down", "instruction": "Başınızı AŞAĞI eğin", "angle": 25},
        {
            "direction": "nod",
            "instruction": "Başınızı EVET anlamında sallayın",
            "angle": 20,
        },
        {
            "direction": "shake",
            "instruction": "Başınızı HAYIR anlamında sallayın",
            "angle": 20,
        },
    ]

    # Audio challenges (optional - for voice deepfakes)
    AUDIO_CHALLENGES = [
        {"text": "3-5-7", "instruction": "Şu sayıları söyleyin: 3, 5, 7"},
        {
            "text": "scanner-ultra",
            "instruction": "Şu kelimeyi söyleyin: scanner ultra",
        },
        {
            "text": random.randint(1000, 9999),
            "instruction": "Şu 4 haneli sayıyı söyleyin: {text}",
        },
    ]

    def generate_session_challenges(
        self, num_challenges: int = 3, challenge_types: list[str] | None = None
    ) -> list[Challenge]:
        """Generate a random sequence of challenges for a session.

        Args:
            num_challenges: Number of challenges to generate (default 3)
            challenge_types: Optional list of challenge types to use.
                           If None, uses all types: ["light", "motion", "audio"]

        Returns:
            List of Challenge objects, randomized and unpredictable
        """
        if challenge_types is None:
            challenge_types = ["light", "motion"]  # Audio optional

        challenges = []
        available_types = challenge_types.copy()

        for _ in range(num_challenges):
            # Pick random type (without replacement to ensure variety)
            if not available_types:
                available_types = challenge_types.copy()

            challenge_type = random.choice(available_types)
            available_types.remove(challenge_type)

            # Generate challenge based on type
            if challenge_type == "light":
                challenge = self._generate_light_challenge()
            elif challenge_type == "motion":
                challenge = self._generate_motion_challenge()
            elif challenge_type == "audio":
                challenge = self._generate_audio_challenge()
            else:
                continue

            challenges.append(challenge)

        # Shuffle to make unpredictable
        random.shuffle(challenges)

        return challenges

    def _generate_light_challenge(self) -> Challenge:
        """Generate a random light challenge (screen color flash)."""
        # Random color sequence (2-4 flashes)
        num_flashes = random.randint(2, 4)
        sequence = []

        for _ in range(num_flashes):
            color = random.choice(self.LIGHT_COLORS)
            duration = random.randint(400, 800)  # ms
            sequence.append({"color": color, "duration_ms": duration})

        challenge_id = f"light_{secrets.token_hex(8)}"

        return Challenge(
            challenge_id=challenge_id,
            challenge_type="light",
            instruction="Ekranınıza bakın - ekran rengi değişecek",
            parameters={"sequence": sequence},
            expected_duration_ms=sum(s["duration_ms"] for s in sequence),
            verification_criteria={
                "min_reflection_change": 0.15,  # Gözlerde en az %15 yansıma değişimi
                "face_brightness_correlation": 0.6,  # Yüz parlaklığı ile ekran korelasyonu
            },
        )

    def _generate_motion_challenge(self) -> Challenge:
        """Generate a random motion challenge (head movement)."""
        motion = random.choice(self.MOTION_DIRECTIONS)
        challenge_id = f"motion_{secrets.token_hex(8)}"

        # Add randomness to expected angle (±5 degrees)
        expected_angle = motion["angle"] + random.randint(-5, 5)

        return Challenge(
            challenge_id=challenge_id,
            challenge_type="motion",
            instruction=motion["instruction"],
            parameters={
                "direction": motion["direction"],
                "expected_angle": expected_angle,
                "tolerance": 10,  # ±10 degrees
            },
            expected_duration_ms=random.randint(2000, 3500),  # 2-3.5s
            verification_criteria={
                "angle_accuracy": 10,  # ±10 degrees tolerance
                "smoothness_threshold": 0.7,  # Motion smoothness score
                "3d_consistency": True,  # Face landmarks must move consistently
            },
        )

    def _generate_audio_challenge(self) -> Challenge:
        """Generate a random audio challenge (speak random words/numbers)."""
        audio = random.choice(self.AUDIO_CHALLENGES)
        challenge_id = f"audio_{secrets.token_hex(8)}"

        # Format instruction with actual text
        instruction = audio["instruction"].format(text=audio["text"])

        return Challenge(
            challenge_id=challenge_id,
            challenge_type="audio",
            instruction=instruction,
            parameters={"expected_text": str(audio["text"]), "language": "tr"},
            expected_duration_ms=random.randint(2000, 4000),
            verification_criteria={
                "speech_match": True,  # Must match expected text
                "voice_consistency": 0.8,  # Voice must match previous samples
                "latency_threshold_ms": 600,  # Human response time
            },
        )
