/**
 * Scanner SDK type definitions
 */

export enum Verdict {
  AUTHENTIC = 'authentic',
  LIKELY_AUTHENTIC = 'likely_authentic',
  UNCERTAIN = 'uncertain',
  LIKELY_FAKE = 'likely_fake',
  FAKE = 'fake',
}

export enum MediaType {
  VIDEO = 'video',
  IMAGE = 'image',
  AUDIO = 'audio',
  TEXT = 'text',
  STREAM = 'stream',
}

export enum ThreatLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ScanResult {
  scan_id: string;
  media_type: MediaType;
  verdict: Verdict;
  trust_score: number;
  confidence: number;
  threat_level: ThreatLevel;
  detector_results: Record<string, any>;
  pentashield: Record<string, any>;
  attribution?: Record<string, any>;
  explanation: Record<string, any>;
  processing_time_ms: number;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  detectors: Array<Record<string, any>>;
  uptime_seconds: number;
}

export interface ScanOptions {
  media_type?: MediaType;
  options?: Record<string, any>;
}

export interface ScannerClientConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}
