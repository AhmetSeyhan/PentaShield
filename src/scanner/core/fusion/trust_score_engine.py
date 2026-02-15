"""Scanner ULTRA — Trust Score Engine.

Final decision layer: 0.0=fake, 1.0=authentic → Verdict + ThreatLevel.
"""

from __future__ import annotations

import logging
from typing import Any

from scanner.models.enums import ThreatLevel, Verdict

logger = logging.getLogger(__name__)

THREAT_MAP = {
    Verdict.FAKE: ThreatLevel.CRITICAL,
    Verdict.LIKELY_FAKE: ThreatLevel.HIGH,
    Verdict.UNCERTAIN: ThreatLevel.MEDIUM,
    Verdict.LIKELY_AUTHENTIC: ThreatLevel.LOW,
    Verdict.AUTHENTIC: ThreatLevel.NONE,
}


class TrustScoreEngine:
    def compute(self, fused_score: float, confidence: float,
                modality_details: dict[str, Any] | None = None) -> dict[str, Any]:
        trust_score = max(0.0, min(1.0, 1.0 - fused_score))
        verdict = self._to_verdict(trust_score)
        threat = THREAT_MAP.get(verdict, ThreatLevel.MEDIUM)
        explanation = self._explain(trust_score, verdict, confidence)
        return {
            "trust_score": round(trust_score, 4),
            "verdict": verdict,
            "threat_level": threat,
            "confidence": round(confidence, 4),
            "explanation": explanation,
        }

    @staticmethod
    def _to_verdict(ts: float) -> Verdict:
        if ts >= 0.8:
            return Verdict.AUTHENTIC
        if ts >= 0.6:
            return Verdict.LIKELY_AUTHENTIC
        if ts >= 0.4:
            return Verdict.UNCERTAIN
        if ts >= 0.2:
            return Verdict.LIKELY_FAKE
        return Verdict.FAKE

    @staticmethod
    def _explain(ts: float, verdict: Verdict, conf: float) -> dict[str, str]:
        msgs = {
            Verdict.AUTHENTIC: "Content appears authentic with high confidence.",
            Verdict.LIKELY_AUTHENTIC: "Content is likely authentic, minor anomalies detected.",
            Verdict.UNCERTAIN: "Unable to determine authenticity. Manual review recommended.",
            Verdict.LIKELY_FAKE: "Content shows signs of manipulation.",
            Verdict.FAKE: "Content is highly likely manipulated or synthetic.",
        }
        return {
            "summary": msgs.get(verdict, msgs[Verdict.UNCERTAIN]),
            "trust_score_label": f"{ts:.0%}",
            "confidence_label": f"{conf:.0%}",
        }
