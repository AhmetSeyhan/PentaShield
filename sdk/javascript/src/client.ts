/**
 * Scanner API client implementation
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { createReadStream } from 'fs';
import { basename } from 'path';
import * as FormData from 'form-data';

import {
  HealthResponse,
  ScanOptions,
  ScanResult,
  ScannerClientConfig,
} from './types';

import {
  ScannerAPIError,
  ScannerAuthError,
  ScannerNotFoundError,
  ScannerRateLimitError,
  ScannerTimeoutError,
  ScannerValidationError,
} from './errors';

/**
 * Scanner API client
 *
 * @example
 * ```typescript
 * const client = new ScannerClient({
 *   apiKey: 'your-api-key',
 *   baseURL: 'http://localhost:8000'
 * });
 *
 * const result = await client.scanFile('./video.mp4');
 * console.log(result.verdict);
 * ```
 */
export class ScannerClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: ScannerClientConfig) {
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: config.baseURL || 'http://localhost:8000',
      timeout: config.timeout || 300000, // 5 minutes default
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleError(error)
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): never {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        throw new ScannerTimeoutError('Request timeout');
      }
      throw new ScannerAPIError(error.message);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        throw new ScannerAuthError('Invalid API key');
      case 403:
        throw new ScannerAuthError('Access forbidden');
      case 404:
        throw new ScannerNotFoundError('Resource not found');
      case 422:
        const detail = (data as any)?.detail || 'Validation error';
        throw new ScannerValidationError(String(detail));
      case 429:
        const retryAfter = error.response.headers['retry-after'];
        throw new ScannerRateLimitError(
          'Rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      default:
        if (status >= 500) {
          throw new ScannerAPIError(`Server error: ${status}`, status);
        }
        throw new ScannerAPIError(`API error: ${status}`, status);
    }
  }

  /**
   * Scan a file for deepfake detection
   *
   * @param filePath - Path to file to scan
   * @param options - Scan options
   * @returns Scan result
   *
   * @example
   * ```typescript
   * const result = await client.scanFile('./video.mp4');
   * console.log(result.verdict);
   * ```
   */
  async scanFile(
    filePath: string,
    options?: ScanOptions
  ): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('file', createReadStream(filePath), basename(filePath));

    if (options?.media_type) {
      formData.append('media_type', options.media_type);
    }

    if (options?.options) {
      formData.append('options', JSON.stringify(options.options));
    }

    const response = await this.client.post<ScanResult>('/v1/scan', formData, {
      headers: formData.getHeaders(),
    });

    return response.data;
  }

  /**
   * Scan a buffer for deepfake detection
   *
   * @param buffer - File buffer
   * @param filename - Filename
   * @param options - Scan options
   * @returns Scan result
   */
  async scanBuffer(
    buffer: Buffer,
    filename: string,
    options?: ScanOptions
  ): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('file', buffer, filename);

    if (options?.media_type) {
      formData.append('media_type', options.media_type);
    }

    if (options?.options) {
      formData.append('options', JSON.stringify(options.options));
    }

    const response = await this.client.post<ScanResult>('/v1/scan', formData, {
      headers: formData.getHeaders(),
    });

    return response.data;
  }

  /**
   * Get scan result by ID
   *
   * @param scanId - Scan ID
   * @returns Scan result
   */
  async getResult(scanId: string): Promise<ScanResult> {
    const response = await this.client.get<ScanResult>(
      `/v1/results/${scanId}`
    );
    return response.data;
  }

  /**
   * Get API health status
   *
   * @returns Health response
   */
  async health(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/v1/health');
    return response.data;
  }

  /**
   * Wait for scan result (polling)
   *
   * @param scanId - Scan ID
   * @param pollInterval - Poll interval in ms (default: 2000)
   * @param maxWait - Maximum wait time in ms (default: 300000)
   * @returns Scan result when ready
   */
  async waitForResult(
    scanId: string,
    pollInterval: number = 2000,
    maxWait: number = 300000
  ): Promise<ScanResult> {
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      try {
        return await this.getResult(scanId);
      } catch (error) {
        if (error instanceof ScannerNotFoundError) {
          // Not ready yet, wait and retry
          await this.sleep(pollInterval);
          continue;
        }
        throw error;
      }
    }

    throw new ScannerTimeoutError(`Result not ready after ${maxWait}ms`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
