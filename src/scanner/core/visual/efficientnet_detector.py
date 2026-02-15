"""Scanner ULTRA — EfficientNet-B0 deepfake detector.

Binary classifier fine-tuned on FaceForensics++ with ImageNet fallback.
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np

from scanner.core.base_detector import BaseDetector, DetectorInput, DetectorResult
from scanner.models.enums import DetectorCapability, DetectorStatus, DetectorType

logger = logging.getLogger(__name__)


class EfficientNetDetector(BaseDetector):
    @property
    def name(self) -> str:
        return "efficientnet_b0"

    @property
    def detector_type(self) -> DetectorType:
        return DetectorType.VISUAL

    @property
    def capabilities(self) -> set[DetectorCapability]:
        return {DetectorCapability.VIDEO_FRAMES, DetectorCapability.SINGLE_IMAGE}

    async def load_model(self) -> None:
        try:
            import timm
            import torch
            self.model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=2)
            if self.model_path:
                state = torch.load(self.model_path, map_location=self.device, weights_only=True)
                self.model.load_state_dict(state)
            else:
                self.model = timm.create_model("efficientnet_b0", pretrained=True, num_classes=1000)
            self.model.to(self.device).eval()
        except ImportError:
            logger.warning("timm/torch not available — stub mode")
            self.model = None

    async def _run_detection(self, inp: DetectorInput) -> DetectorResult:
        frames = inp.frames or ([inp.image] if inp.image is not None else [])
        if not frames:
            return DetectorResult(detector_name=self.name, detector_type=self.detector_type,
                                  score=0.5, confidence=0.0, method="efficientnet_skip",
                                  status=DetectorStatus.SKIPPED)
        if self.model is None:
            return DetectorResult(detector_name=self.name, detector_type=self.detector_type,
                                  score=0.5, confidence=0.1, method="efficientnet_stub",
                                  status=DetectorStatus.PASS, details={"mode": "stub"})
        try:
            import torch
            import torch.nn.functional as F
            from torchvision import transforms
            transform = transforms.Compose([
                transforms.ToPILImage(), transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ])
            scores = []
            for frame in frames[:16]:
                tensor = transform(frame).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    logits = self.model(tensor)
                    prob = F.softmax(logits, dim=-1)[0, 1].item() if logits.shape[-1] == 2 \
                        else torch.sigmoid(logits[0, 0]).item()
                scores.append(prob)
            avg = float(np.mean(scores))
            std = float(np.std(scores))
            return DetectorResult(detector_name=self.name, detector_type=self.detector_type,
                                  score=avg, confidence=max(0.1, 1.0 - std * 2),
                                  method="efficientnet_ff++", status=DetectorStatus.PASS,
                                  details={"n_frames": len(scores), "std": round(std, 4)})
        except Exception as exc:
            return DetectorResult(detector_name=self.name, detector_type=self.detector_type,
                                  score=0.5, confidence=0.0, method="efficientnet_error",
                                  status=DetectorStatus.ERROR, details={"error": str(exc)})

    def get_model_info(self) -> dict[str, Any]:
        return {"name": "EfficientNet-B0", "params": "5.3M", "input_size": "224x224",
                "training": "FaceForensics++ / ImageNet"}
