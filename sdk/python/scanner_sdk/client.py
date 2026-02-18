"""Scanner SDK client implementation."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any, BinaryIO

import httpx

from scanner_sdk.exceptions import (
    ScannerAPIError,
    ScannerAuthError,
    ScannerNotFoundError,
    ScannerRateLimitError,
    ScannerTimeoutError,
    ScannerValidationError,
)
from scanner_sdk.models import HealthResponse, ScanResult


class ScannerClient:
    """Synchronous Scanner API client.

    Usage:
        client = ScannerClient(api_key="your-key")
        result = client.scan_file("video.mp4")
        print(result.verdict)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "http://localhost:8000",
        timeout: float = 300.0,
    ) -> None:
        """Initialize Scanner client.

        Args:
            api_key: API key for authentication
            base_url: Base URL of Scanner API
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.client = httpx.Client(timeout=timeout)

    def __enter__(self) -> ScannerClient:
        """Context manager entry."""
        return self

    def __exit__(self, *args: Any) -> None:
        """Context manager exit."""
        self.close()

    def close(self) -> None:
        """Close HTTP client."""
        self.client.close()

    def _get_headers(self) -> dict[str, str]:
        """Get request headers."""
        return {
            "X-API-Key": self.api_key,
        }

    def _handle_response(self, response: httpx.Response) -> Any:
        """Handle API response and raise exceptions if needed."""
        if response.status_code == 200:
            return response.json()

        if response.status_code == 401:
            raise ScannerAuthError("Invalid API key", status_code=401)

        if response.status_code == 403:
            raise ScannerAuthError("Access forbidden", status_code=403)

        if response.status_code == 404:
            raise ScannerNotFoundError("Resource not found", status_code=404)

        if response.status_code == 422:
            detail = response.json().get("detail", "Validation error")
            raise ScannerValidationError(str(detail), status_code=422)

        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            retry_after_int = int(retry_after) if retry_after else None
            raise ScannerRateLimitError("Rate limit exceeded", retry_after=retry_after_int)

        if response.status_code >= 500:
            raise ScannerAPIError(f"Server error: {response.status_code}", status_code=response.status_code)

        raise ScannerAPIError(f"API error: {response.status_code}", status_code=response.status_code)

    def scan_file(
        self,
        file_path: str | Path,
        media_type: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> ScanResult:
        """Scan a media file for deepfake detection.

        Args:
            file_path: Path to media file
            media_type: Media type (video/image/audio/text), auto-detected if None
            options: Additional scan options

        Returns:
            ScanResult with detection verdict

        Raises:
            ScannerAPIError: On API error
            ScannerAuthError: On authentication failure
            ScannerTimeoutError: On timeout
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            with open(file_path, "rb") as f:
                return self.scan_fileobj(f, media_type=media_type, options=options)
        except httpx.TimeoutException as e:
            raise ScannerTimeoutError(f"Request timeout: {e}") from e

    def scan_fileobj(
        self,
        file: BinaryIO,
        media_type: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> ScanResult:
        """Scan a file object for deepfake detection.

        Args:
            file: File-like object to scan
            media_type: Media type, auto-detected if None
            options: Additional scan options

        Returns:
            ScanResult with detection verdict
        """
        files = {"file": file}
        data = {}
        if media_type:
            data["media_type"] = media_type
        if options:
            data["options"] = options

        response = self.client.post(
            f"{self.base_url}/v1/scan",
            headers=self._get_headers(),
            files=files,
            data=data,
        )

        result_data = self._handle_response(response)
        return ScanResult.from_dict(result_data)

    def get_result(self, scan_id: str) -> ScanResult:
        """Get scan result by ID.

        Args:
            scan_id: Scan ID

        Returns:
            ScanResult

        Raises:
            ScannerNotFoundError: If scan not found
        """
        response = self.client.get(
            f"{self.base_url}/v1/results/{scan_id}",
            headers=self._get_headers(),
        )

        result_data = self._handle_response(response)
        return ScanResult.from_dict(result_data)

    def health(self) -> HealthResponse:
        """Get API health status.

        Returns:
            HealthResponse
        """
        response = self.client.get(f"{self.base_url}/v1/health")
        health_data = self._handle_response(response)
        return HealthResponse.from_dict(health_data)

    def wait_for_result(
        self,
        scan_id: str,
        poll_interval: float = 2.0,
        max_wait: float = 300.0,
    ) -> ScanResult:
        """Poll for scan result until complete or timeout.

        Args:
            scan_id: Scan ID
            poll_interval: Seconds between polls
            max_wait: Maximum seconds to wait

        Returns:
            ScanResult when ready

        Raises:
            ScannerTimeoutError: If max_wait exceeded
        """
        start = time.time()

        while time.time() - start < max_wait:
            try:
                result = self.get_result(scan_id)
                return result
            except ScannerNotFoundError:
                # Not ready yet, continue polling
                time.sleep(poll_interval)

        raise ScannerTimeoutError(f"Result not ready after {max_wait}s")


class AsyncScannerClient:
    """Asynchronous Scanner API client.

    Usage:
        async with AsyncScannerClient(api_key="your-key") as client:
            result = await client.scan_file("video.mp4")
            print(result.verdict)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "http://localhost:8000",
        timeout: float = 300.0,
    ) -> None:
        """Initialize async Scanner client.

        Args:
            api_key: API key for authentication
            base_url: Base URL of Scanner API
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    async def __aenter__(self) -> AsyncScannerClient:
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.close()

    async def close(self) -> None:
        """Close HTTP client."""
        await self.client.aclose()

    def _get_headers(self) -> dict[str, str]:
        """Get request headers."""
        return {
            "X-API-Key": self.api_key,
        }

    def _handle_response(self, response: httpx.Response) -> Any:
        """Handle API response (same as sync client)."""
        if response.status_code == 200:
            return response.json()

        if response.status_code == 401:
            raise ScannerAuthError("Invalid API key", status_code=401)

        if response.status_code == 403:
            raise ScannerAuthError("Access forbidden", status_code=403)

        if response.status_code == 404:
            raise ScannerNotFoundError("Resource not found", status_code=404)

        if response.status_code == 422:
            detail = response.json().get("detail", "Validation error")
            raise ScannerValidationError(str(detail), status_code=422)

        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            retry_after_int = int(retry_after) if retry_after else None
            raise ScannerRateLimitError("Rate limit exceeded", retry_after=retry_after_int)

        if response.status_code >= 500:
            raise ScannerAPIError(f"Server error: {response.status_code}", status_code=response.status_code)

        raise ScannerAPIError(f"API error: {response.status_code}", status_code=response.status_code)

    async def scan_file(
        self,
        file_path: str | Path,
        media_type: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> ScanResult:
        """Scan a media file for deepfake detection (async).

        Args:
            file_path: Path to media file
            media_type: Media type, auto-detected if None
            options: Additional scan options

        Returns:
            ScanResult with detection verdict
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            with open(file_path, "rb") as f:
                return await self.scan_fileobj(f, media_type=media_type, options=options)
        except httpx.TimeoutException as e:
            raise ScannerTimeoutError(f"Request timeout: {e}") from e

    async def scan_fileobj(
        self,
        file: BinaryIO,
        media_type: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> ScanResult:
        """Scan a file object for deepfake detection (async).

        Args:
            file: File-like object to scan
            media_type: Media type, auto-detected if None
            options: Additional scan options

        Returns:
            ScanResult with detection verdict
        """
        files = {"file": file}
        data = {}
        if media_type:
            data["media_type"] = media_type
        if options:
            data["options"] = options

        response = await self.client.post(
            f"{self.base_url}/v1/scan",
            headers=self._get_headers(),
            files=files,
            data=data,
        )

        result_data = self._handle_response(response)
        return ScanResult.from_dict(result_data)

    async def get_result(self, scan_id: str) -> ScanResult:
        """Get scan result by ID (async).

        Args:
            scan_id: Scan ID

        Returns:
            ScanResult
        """
        response = await self.client.get(
            f"{self.base_url}/v1/results/{scan_id}",
            headers=self._get_headers(),
        )

        result_data = self._handle_response(response)
        return ScanResult.from_dict(result_data)

    async def health(self) -> HealthResponse:
        """Get API health status (async).

        Returns:
            HealthResponse
        """
        response = await self.client.get(f"{self.base_url}/v1/health")
        health_data = self._handle_response(response)
        return HealthResponse.from_dict(health_data)
