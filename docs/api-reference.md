# Scanner ULTRA — API Reference

**Version:** 5.0.0
**Base URL:** `https://api.scanner-ultra.ai` (production) or `http://localhost:8000` (local)

---

## Authentication

All API requests require an API key passed via the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key-here" https://api.scanner-ultra.ai/v1/health
```

**Rate Limits:**
- Free tier: 10 requests/minute
- Pro tier: 100 requests/minute
- Enterprise: Custom limits

---

## Endpoints

### 1. Health Check

**GET** `/v1/health`

Check API status and detector availability.

**Response:**
```json
{
  "status": "healthy",
  "version": "5.0.0",
  "detectors": {
    "visual": 10,
    "audio": 6,
    "text": 3
  },
  "pentashield_status": {
    "hydra": "operational",
    "sentinel": "operational",
    "forensic_dna": "operational",
    "active_probe": "operational",
    "ghost_protocol": "operational"
  }
}
```

---

### 2. Scan Media

**POST** `/v1/scan`

Analyze media file for deepfake detection.

**Request:**
```bash
curl -X POST https://api.scanner-ultra.ai/v1/scan \
  -H "X-API-Key: your-key" \
  -F "file=@video.mp4" \
  -F "media_type=video"  # optional: auto-detected
```

**Supported Formats:**
- **Video:** MP4, AVI, MOV, MKV, WebM
- **Image:** JPEG, PNG, WebP
- **Audio:** MP3, WAV, FLAC, M4A
- **Text:** TXT, JSON

**Response:**
```json
{
  "scan_id": "scn_abc123xyz",
  "media_type": "video",
  "verdict": "likely_fake",
  "trust_score": 0.12,
  "confidence": 0.94,
  "threat_level": "high",
  "detector_results": {
    "clip": {
      "score": 0.89,
      "confidence": 0.95,
      "method": "LayerNorm fine-tuned CLIP"
    },
    "ppg_biosignal": {
      "score": 0.92,
      "confidence": 0.88,
      "details": {
        "heart_rate_bpm": 0,
        "snr_db": -5.2,
        "bio_plausible": false
      }
    }
  },
  "pentashield": {
    "hydra": {
      "adversarial_detected": false,
      "head_verdicts": [0.85, 0.89, 0.87],
      "consensus_score": 0.87,
      "robustness_score": 0.96
    },
    "sentinel": {
      "ood_score": 0.15,
      "is_novel_type": false,
      "physics_score": 0.68,
      "physics_anomalies": ["lighting_inconsistency"],
      "bio_consistency": 0.32,
      "anomaly_score": 0.42,
      "alert_level": "medium"
    },
    "forensic_dna": {
      "generator_detected": true,
      "generator_type": "stylegan2",
      "generator_confidence": 0.82,
      "spectral_fingerprints": [...]
    },
    "active_probe": {
      "probe_available": false,
      "liveness_score": 1.0,
      "probe_verdict": "not_applicable"
    },
    "ghost_protocol": {
      "edge_compatible": true,
      "model_size_mb": 8.2,
      "edge_inference_ms": 87
    }
  },
  "attribution": {
    "generator_family": "gan",
    "likely_tool": "StyleGAN2",
    "confidence": 0.82,
    "evidence": ["spectral_match", "periodic_peaks"]
  },
  "explanation": {
    "verdict_reason": "Multiple indicators suggest synthetic content",
    "key_factors": [
      "No biological pulse signal detected",
      "Spectral analysis matches StyleGAN2 fingerprint",
      "Lighting direction inconsistent across face"
    ],
    "detector_consensus": 0.87
  },
  "processing_time_ms": 2847,
  "created_at": "2026-02-18T12:34:56Z"
}
```

**Verdict Types:**
- `authentic` — Real content (trust_score > 0.7)
- `likely_authentic` — Probably real (trust_score 0.5-0.7)
- `uncertain` — Cannot determine (trust_score 0.3-0.5)
- `likely_fake` — Probably synthetic (trust_score 0.1-0.3)
- `fake` — Synthetic content (trust_score < 0.1)

**Threat Levels:**
- `none` — No deepfake detected
- `low` — Minor inconsistencies
- `medium` — Suspicious indicators
- `high` — Strong evidence of manipulation
- `critical` — Confirmed deepfake with malicious intent

---

### 3. Get Scan Result

**GET** `/v1/results/{scan_id}`

Retrieve previously completed scan results.

**Response:** Same as `/v1/scan` response

---

### 4. Generate Report

**POST** `/v1/reports/{scan_id}`

Generate a forensic PDF report (Enterprise feature).

**Request:**
```bash
curl -X POST https://api.scanner-ultra.ai/v1/reports/scn_abc123 \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"format": "pdf", "include_heatmap": true}'
```

**Response:**
```json
{
  "report_url": "https://cdn.scanner-ultra.ai/reports/scn_abc123.pdf",
  "expires_at": "2026-02-25T12:34:56Z"
}
```

---

### 5. Active Probe (Real-time Verification)

#### 5.1 Start Challenge Session

**POST** `/v1/challenge/start`

Initiate a live challenge-response verification session.

**Request:**
```json
{
  "challenge_types": ["light", "motion", "latency"]
}
```

**Response:**
```json
{
  "session_id": "sess_xyz789",
  "challenges": [
    {
      "type": "light",
      "instruction": "Face the camera and show your screen with this color",
      "expected_color": "#FF5733",
      "timeout_seconds": 10
    },
    {
      "type": "motion",
      "instruction": "Turn your head slowly to the right",
      "expected_direction": "right",
      "timeout_seconds": 5
    }
  ],
  "expires_at": "2026-02-18T12:44:56Z"
}
```

#### 5.2 Get Challenge Status

**GET** `/v1/challenge/{session_id}`

Check current challenge session status.

#### 5.3 Verify Challenge Response

**POST** `/v1/challenge/{session_id}/verify`

Submit video frames for challenge verification.

**Request:**
```bash
curl -X POST https://api.scanner-ultra.ai/v1/challenge/sess_xyz789/verify \
  -H "X-API-Key: your-key" \
  -F "frames=@response_video.mp4"
```

**Response:**
```json
{
  "session_id": "sess_xyz789",
  "verdict": "live",
  "confidence": 0.96,
  "challenges_passed": 3,
  "challenges_total": 3,
  "liveness_score": 0.96,
  "latency_analysis": {
    "avg_response_ms": 187,
    "is_realtime": true
  },
  "details": {
    "light_challenge": {
      "passed": true,
      "color_match_score": 0.94
    },
    "motion_challenge": {
      "passed": true,
      "direction_correct": true,
      "smoothness_score": 0.98
    },
    "latency_challenge": {
      "passed": true,
      "latency_ms": 187,
      "threshold_ms": 500
    }
  }
}
```

**Verdicts:**
- `live` — Real-time human interaction confirmed
- `suspicious` — Some challenges failed
- `playback` — Pre-recorded content detected
- `not_applicable` — Challenge not suitable for this media

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request — Invalid input |
| 401 | Unauthorized — Missing or invalid API key |
| 403 | Forbidden — Insufficient permissions |
| 404 | Not Found — Resource doesn't exist |
| 429 | Too Many Requests — Rate limit exceeded |
| 500 | Internal Server Error — Server error |
| 503 | Service Unavailable — Detector temporarily unavailable |

**Error Response:**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit of 10 requests/minute exceeded",
  "retry_after_seconds": 45
}
```

---

## Webhook Notifications (Enterprise)

Configure webhooks to receive scan results asynchronously:

```json
{
  "webhook_url": "https://your-domain.com/scanner-webhook",
  "events": ["scan.completed", "scan.failed"],
  "secret": "your-webhook-secret"
}
```

**Webhook Payload:**
```json
{
  "event": "scan.completed",
  "scan_id": "scn_abc123",
  "timestamp": "2026-02-18T12:34:56Z",
  "data": { /* ScanResult object */ }
}
```

---

## SDKs

- **Python SDK:** `pip install scanner-ultra-sdk`
- **JavaScript SDK:** `npm install @scanner/sdk`
- **Browser Extension:** Available on Chrome Web Store

See SDK-specific documentation for usage examples.

---

## Support

- **Documentation:** https://docs.scanner-ultra.ai
- **API Status:** https://status.scanner-ultra.ai
- **Discord:** https://discord.gg/scanner-ultra
- **Email:** support@scanner-tech.ai
