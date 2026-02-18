"""Scanner SDK — Python client library for Scanner ULTRA API.

Usage:
    from scanner_sdk import ScannerClient

    # Sync client
    client = ScannerClient(api_key="your-api-key")
    result = client.scan_file("video.mp4")
    print(result.verdict)

    # Async client
    async with AsyncScannerClient(api_key="your-api-key") as client:
        result = await client.scan_file("video.mp4")
        print(result.verdict)
"""

from scanner_sdk.client import AsyncScannerClient, ScannerClient
from scanner_sdk.exceptions import (
    ScannerAPIError,
    ScannerAuthError,
    ScannerRateLimitError,
    ScannerTimeoutError,
)
from scanner_sdk.models import ScanResult, Verdict

__version__ = "5.0.0"

__all__ = [
    "ScannerClient",
    "AsyncScannerClient",
    "ScanResult",
    "Verdict",
    "ScannerAPIError",
    "ScannerAuthError",
    "ScannerRateLimitError",
    "ScannerTimeoutError",
]
