"""Scanner ULTRA — Shared enumerations."""

from enum import Enum


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    TEXT = "text"
    STREAM = "stream"


class Verdict(str, Enum):
    AUTHENTIC = "authentic"
    LIKELY_AUTHENTIC = "likely_authentic"
    UNCERTAIN = "uncertain"
    LIKELY_FAKE = "likely_fake"
    FAKE = "fake"


class ThreatLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DetectorType(str, Enum):
    VISUAL = "visual"
    AUDIO = "audio"
    TEXT = "text"
    MULTIMODAL = "multimodal"
    BIOLOGICAL = "biological"
    FUSION = "fusion"
    DEFENSE = "defense"
    PENTASHIELD = "pentashield"


class DetectorCapability(str, Enum):
    VIDEO_FRAMES = "video_frames"
    SINGLE_IMAGE = "single_image"
    AUDIO_TRACK = "audio_track"
    TEXT_CONTENT = "text_content"
    AV_SYNC = "av_sync"
    BIOLOGICAL_SIGNAL = "biological_signal"
    FREQUENCY_ANALYSIS = "frequency_analysis"
    GENERATOR_FINGERPRINT = "generator_fingerprint"
    ADVERSARIAL_DEFENSE = "adversarial_defense"
    OOD_DETECTION = "ood_detection"
    PHYSICS_VERIFICATION = "physics_verification"
    BIO_CROSS_CHECK = "bio_cross_check"
    ANOMALY_DETECTION = "anomaly_detection"


class DetectorStatus(str, Enum):
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"
    ERROR = "ERROR"
    SKIPPED = "SKIPPED"
