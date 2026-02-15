"""Scanner ULTRA — Cross-modal attention fusion."""

from __future__ import annotations

import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

ATTENTION_PRIORS = {
    ("visual", "audio"): 0.7,
    ("visual", "text"): 0.4,
    ("audio", "text"): 0.5,
}


class CrossModalAttention:
    """Cross-modal attention-based fusion of detector results."""

    def fuse(
        self,
        visual_results: dict[str, dict[str, Any]],
        audio_results: dict[str, dict[str, Any]],
        text_results: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        modality_scores: dict[str, dict[str, Any]] = {}

        for name, results in [("visual", visual_results), ("audio", audio_results),
                               ("text", text_results)]:
            if results:
                scores = [r.get("score", 0.5) for r in results.values()]
                confs = [r.get("confidence", 0.0) for r in results.values()]
                tc = sum(confs) + 1e-8
                modality_scores[name] = {
                    "score": sum(s * c for s, c in zip(scores, confs)) / tc,
                    "confidence": float(np.mean(confs)) if confs else 0.0,
                    "n_detectors": len(results),
                }

        if not modality_scores:
            return {"fused_score": 0.5, "confidence": 0.0, "method": "no_modalities"}

        weights = self._compute_attention(modality_scores)
        fs, tw = 0.0, 0.0
        for m, info in modality_scores.items():
            w = weights.get(m, 1.0)
            fs += w * info["score"] * info["confidence"]
            tw += w * info["confidence"]

        agreement = self._agreement(modality_scores)
        return {
            "fused_score": round(fs / tw if tw > 0 else 0.5, 4),
            "confidence": round(min(0.95, agreement * 1.2), 4),
            "attention_weights": {k: round(v, 4) for k, v in weights.items()},
            "modality_scores": {k: round(v["score"], 4) for k, v in modality_scores.items()},
            "agreement": round(agreement, 4),
            "method": "cross_modal_attention",
        }

    @staticmethod
    def _compute_attention(ms: dict[str, dict]) -> dict[str, float]:
        mods = list(ms.keys())
        weights = {m: 1.0 for m in mods}
        for i, m1 in enumerate(mods):
            for m2 in mods[i + 1:]:
                agr = 1.0 - abs(ms[m1]["score"] - ms[m2]["score"])
                prior = ATTENTION_PRIORS.get((m1, m2), ATTENTION_PRIORS.get((m2, m1), 0.5))
                boost = agr * prior
                weights[m1] += boost
                weights[m2] += boost
        total = sum(weights.values())
        return {m: w / total for m, w in weights.items()}

    @staticmethod
    def _agreement(ms: dict[str, dict]) -> float:
        scores = [info["score"] for info in ms.values()]
        if len(scores) < 2:
            return 0.5
        return max(0.0, 1.0 - float(np.std(scores)) * 3)
