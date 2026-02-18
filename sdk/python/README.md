# Scanner SDK for Python

Official Python client library for Scanner ULTRA deepfake detection API.

## Installation

```bash
pip install scanner-sdk
```

## Quick Start

### Synchronous Client

```python
from scanner_sdk import ScannerClient

# Initialize client
client = ScannerClient(api_key="your-api-key-here")

# Scan a file
result = client.scan_file("video.mp4")

# Check verdict
print(f"Verdict: {result.verdict}")
print(f"Trust Score: {result.trust_score:.2%}")
print(f"Threat Level: {result.threat_level}")

# Get detailed results
print(f"PentaShield Analysis: {result.pentashield}")
```

### Asynchronous Client

```python
import asyncio
from scanner_sdk import AsyncScannerClient

async def scan_video():
    async with AsyncScannerClient(api_key="your-api-key") as client:
        result = await client.scan_file("video.mp4")
        print(f"Verdict: {result.verdict}")

asyncio.run(scan_video())
```

### Health Check

```python
# Check API health
health = client.health()
print(f"Status: {health.status}")
print(f"Version: {health.version}")
print(f"Detectors: {len(health.detectors)}")
```

## Advanced Usage

### Custom Options

```python
result = client.scan_file(
    "video.mp4",
    media_type="video",
    options={
        "enable_forensic_dna": True,
        "enable_active_probe": False,
    }
)
```

### Error Handling

```python
from scanner_sdk import (
    ScannerAuthError,
    ScannerRateLimitError,
    ScannerTimeoutError,
)

try:
    result = client.scan_file("video.mp4")
except ScannerAuthError:
    print("Invalid API key")
except ScannerRateLimitError as e:
    print(f"Rate limited, retry after {e.retry_after}s")
except ScannerTimeoutError:
    print("Request timed out")
```

### Context Manager

```python
with ScannerClient(api_key="your-key") as client:
    result1 = client.scan_file("video1.mp4")
    result2 = client.scan_file("video2.mp4")
# Client automatically closed
```

## API Reference

### ScannerClient

- `scan_file(file_path, media_type=None, options=None)` → `ScanResult`
- `scan_fileobj(file, media_type=None, options=None)` → `ScanResult`
- `get_result(scan_id)` → `ScanResult`
- `health()` → `HealthResponse`

### AsyncScannerClient

Same methods as `ScannerClient`, but async.

### ScanResult

- `scan_id: str` — Unique scan identifier
- `verdict: Verdict` — Detection verdict
- `trust_score: float` — Trust score (0.0-1.0, higher = more authentic)
- `confidence: float` — Confidence in verdict
- `threat_level: ThreatLevel` — Threat level assessment
- `detector_results: dict` — Individual detector results
- `pentashield: dict` — PentaShield™ analysis
- `attribution: dict | None` — Source attribution (if available)
- `explanation: dict` — Explanation and reasoning
- `processing_time_ms: float` — Processing time

### Verdict Enum

- `Verdict.AUTHENTIC` — Confirmed authentic
- `Verdict.LIKELY_AUTHENTIC` — Probably authentic
- `Verdict.UNCERTAIN` — Cannot determine
- `Verdict.LIKELY_FAKE` — Probably fake
- `Verdict.FAKE` — Confirmed fake

## License

Apache 2.0
