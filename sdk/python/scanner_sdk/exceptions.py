"""Scanner SDK exceptions."""

from __future__ import annotations


class ScannerAPIError(Exception):
    """Base exception for Scanner API errors."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        """Initialize exception.

        Args:
            message: Error message
            status_code: HTTP status code
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ScannerAuthError(ScannerAPIError):
    """Authentication error (401/403)."""

    pass


class ScannerRateLimitError(ScannerAPIError):
    """Rate limit exceeded (429)."""

    def __init__(self, message: str, retry_after: int | None = None) -> None:
        """Initialize rate limit error.

        Args:
            message: Error message
            retry_after: Seconds to wait before retry
        """
        super().__init__(message, status_code=429)
        self.retry_after = retry_after


class ScannerTimeoutError(ScannerAPIError):
    """Request timeout error."""

    pass


class ScannerNotFoundError(ScannerAPIError):
    """Resource not found (404)."""

    pass


class ScannerValidationError(ScannerAPIError):
    """Request validation error (422)."""

    pass
