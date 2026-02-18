/**
 * Scanner SDK error classes
 */

export class ScannerAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ScannerAPIError';
  }
}

export class ScannerAuthError extends ScannerAPIError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'ScannerAuthError';
  }
}

export class ScannerRateLimitError extends ScannerAPIError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'ScannerRateLimitError';
  }
}

export class ScannerTimeoutError extends ScannerAPIError {
  constructor(message: string) {
    super(message);
    this.name = 'ScannerTimeoutError';
  }
}

export class ScannerNotFoundError extends ScannerAPIError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'ScannerNotFoundError';
  }
}

export class ScannerValidationError extends ScannerAPIError {
  constructor(message: string) {
    super(message, 422);
    this.name = 'ScannerValidationError';
  }
}
