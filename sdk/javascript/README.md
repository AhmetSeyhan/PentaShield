# Scanner ULTRA — JavaScript/TypeScript SDK

Official JavaScript and TypeScript client library for the Scanner ULTRA deepfake detection API.

[![npm version](https://img.shields.io/npm/v/@scanner/sdk.svg)](https://www.npmjs.com/package/@scanner/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)

---

## Features

- ✅ **Full TypeScript support** with comprehensive type definitions
- ✅ **Promise-based API** for async/await
- ✅ **Automatic retries** with exponential backoff
- ✅ **Rate limit handling** with built-in backoff
- ✅ **File and Buffer support** for flexible input
- ✅ **Real-time challenge-response** for liveness verification
- ✅ **Webhook support** for async scan results
- ✅ **Node.js and Browser** compatible

---

## Installation

### npm

```bash
npm install @scanner/sdk
```

### yarn

```bash
yarn add @scanner/sdk
```

### pnpm

```bash
pnpm add @scanner/sdk
```

---

## Quick Start

### Basic Usage (TypeScript)

```typescript
import { ScannerClient } from '@scanner/sdk';

const client = new ScannerClient({
  apiKey: 'your-api-key-here',
  baseURL: 'https://api.scanner-ultra.ai',  // optional
});

// Scan a file
const result = await client.scanFile('./video.mp4');

console.log(`Verdict: ${result.verdict}`);
console.log(`Trust Score: ${(result.trust_score * 100).toFixed(1)}%`);
console.log(`Threat Level: ${result.threat_level}`);

if (result.verdict === 'likely_fake' || result.verdict === 'fake') {
  console.log('⚠️ Deepfake detected!');
  console.log(`Generator: ${result.attribution?.likely_tool}`);
}
```

### JavaScript (CommonJS)

```javascript
const { ScannerClient } = require('@scanner/sdk');

const client = new ScannerClient({ apiKey: process.env.SCANNER_API_KEY });

client.scanFile('./image.jpg')
  .then(result => {
    console.log('Verdict:', result.verdict);
    console.log('Trust Score:', result.trust_score);
  })
  .catch(error => {
    console.error('Scan failed:', error.message);
  });
```

---

## API Reference

### Constructor

```typescript
const client = new ScannerClient(options: ScannerOptions);
```

**Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `apiKey` | string | Yes | — | Your Scanner ULTRA API key |
| `baseURL` | string | No | `https://api.scanner-ultra.ai` | API base URL |
| `timeout` | number | No | `120000` | Request timeout (ms) |
| `maxRetries` | number | No | `3` | Max retry attempts |
| `retryDelay` | number | No | `1000` | Initial retry delay (ms) |

**Example:**

```typescript
const client = new ScannerClient({
  apiKey: process.env.SCANNER_API_KEY!,
  baseURL: 'http://localhost:8000',  // for local development
  timeout: 300000,  // 5 minutes
  maxRetries: 5,
});
```

---

### Methods

#### `scanFile(filePath, options?)`

Scan a file from disk.

```typescript
async scanFile(
  filePath: string,
  options?: ScanOptions
): Promise<ScanResult>
```

**Example:**

```typescript
const result = await client.scanFile('./deepfake.mp4', {
  media_type: 'video',  // optional: auto-detected if not specified
});
```

---

#### `scanBuffer(buffer, options?)`

Scan media from a Buffer.

```typescript
async scanBuffer(
  buffer: Buffer,
  options?: ScanOptions
): Promise<ScanResult>
```

**Example:**

```typescript
import { readFile } from 'fs/promises';

const buffer = await readFile('./image.png');
const result = await client.scanBuffer(buffer, {
  media_type: 'image',
  filename: 'suspect.png',  // optional
});
```

---

#### `scanStream(stream, options?)`

Scan media from a readable stream.

```typescript
async scanStream(
  stream: ReadableStream,
  options?: ScanOptions
): Promise<ScanResult>
```

**Example:**

```typescript
import { createReadStream } from 'fs';

const stream = createReadStream('./video.mp4');
const result = await client.scanStream(stream, { media_type: 'video' });
```

---

#### `getResult(scanId)`

Retrieve a previously completed scan result.

```typescript
async getResult(scanId: string): Promise<ScanResult>
```

**Example:**

```typescript
const result = await client.getResult('scn_abc123xyz');
```

---

#### `health()`

Check API health and detector status.

```typescript
async health(): Promise<HealthResponse>
```

**Example:**

```typescript
const health = await client.health();
console.log('API Status:', health.status);
console.log('Visual Detectors:', health.detectors.visual);
console.log('PentaShield:', health.pentashield_status);
```

---

#### `waitForResult(scanId, options?)`

Poll for scan completion (for async scans).

```typescript
async waitForResult(
  scanId: string,
  options?: { interval?: number; timeout?: number }
): Promise<ScanResult>
```

**Example:**

```typescript
// Start async scan (webhook-based)
const { scan_id } = await client.startAsyncScan('./large-video.mp4');

// Poll for completion
const result = await client.waitForResult(scan_id, {
  interval: 5000,   // poll every 5 seconds
  timeout: 300000,  // give up after 5 minutes
});
```

---

### Challenge-Response (Liveness Verification)

#### `startChallenge(options?)`

Start a real-time liveness verification session.

```typescript
async startChallenge(
  options?: ChallengeOptions
): Promise<ChallengeResponse>
```

**Example:**

```typescript
const session = await client.startChallenge({
  challenge_types: ['light', 'motion', 'latency'],
});

console.log('Session ID:', session.session_id);
console.log('Challenges:', session.challenges);

// Display challenges to user
for (const challenge of session.challenges) {
  console.log(`${challenge.type}: ${challenge.instruction}`);
}
```

---

#### `getChallenge(sessionId)`

Get challenge session status.

```typescript
async getChallenge(sessionId: string): Promise<ChallengeResponse>
```

**Example:**

```typescript
const status = await client.getChallenge(session.session_id);
console.log('Challenges completed:', status.challenges_passed);
```

---

#### `verifyChallenge(sessionId, frames)`

Submit video frames for challenge verification.

```typescript
async verifyChallenge(
  sessionId: string,
  frames: Buffer | string
): Promise<VerifyChallengeResponse>
```

**Example:**

```typescript
// Record user's response video
const responseVideo = await recordChallengeResponse(session.challenges);

// Verify
const verification = await client.verifyChallenge(
  session.session_id,
  responseVideo
);

console.log('Verdict:', verification.verdict);  // 'live', 'playback', 'suspicious'
console.log('Liveness Score:', verification.liveness_score);
console.log('Latency:', verification.latency_analysis.avg_response_ms, 'ms');

if (verification.verdict === 'live') {
  console.log('✅ Real human verified!');
} else {
  console.log('⚠️ Liveness verification failed');
}
```

---

## Type Definitions

### ScanResult

```typescript
interface ScanResult {
  scan_id: string;
  media_type: MediaType;
  verdict: Verdict;
  trust_score: number;         // 0.0 - 1.0
  confidence: number;           // 0.0 - 1.0
  threat_level: ThreatLevel;
  detector_results: Record<string, DetectorResult>;
  pentashield: PentaShieldResult;
  attribution: Attribution | null;
  explanation: Explanation;
  processing_time_ms: number;
  created_at: string;           // ISO 8601
}
```

### Verdict

```typescript
type Verdict =
  | 'authentic'        // trust_score > 0.7
  | 'likely_authentic' // trust_score 0.5-0.7
  | 'uncertain'        // trust_score 0.3-0.5
  | 'likely_fake'      // trust_score 0.1-0.3
  | 'fake';            // trust_score < 0.1
```

### ThreatLevel

```typescript
type ThreatLevel =
  | 'none'      // No deepfake
  | 'low'       // Minor inconsistencies
  | 'medium'    // Suspicious indicators
  | 'high'      // Strong evidence
  | 'critical'; // Confirmed deepfake
```

### PentaShieldResult

```typescript
interface PentaShieldResult {
  hydra: {
    adversarial_detected: boolean;
    head_verdicts: number[];
    consensus_score: number;
    robustness_score: number;
  };
  sentinel: {
    ood_score: number;
    is_novel_type: boolean;
    physics_score: number;
    physics_anomalies: string[];
    bio_consistency: number;
    anomaly_score: number;
    alert_level: string;
  };
  forensic_dna: {
    generator_detected: boolean;
    generator_type: string | null;
    generator_confidence: number;
    spectral_fingerprints: any[];
  };
  active_probe: {
    probe_available: boolean;
    liveness_score: number;
    probe_verdict: string;
  };
  ghost_protocol: {
    edge_compatible: boolean;
    model_size_mb: number;
    edge_inference_ms: number;
  };
}
```

---

## Error Handling

The SDK throws typed errors for better error handling:

```typescript
import {
  ScannerAuthError,
  ScannerRateLimitError,
  ScannerTimeoutError,
  ScannerServerError,
} from '@scanner/sdk';

try {
  const result = await client.scanFile('./video.mp4');
} catch (error) {
  if (error instanceof ScannerAuthError) {
    console.error('Invalid API key');
  } else if (error instanceof ScannerRateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
    // Wait and retry
    await sleep(error.retryAfter * 1000);
    const result = await client.scanFile('./video.mp4');
  } else if (error instanceof ScannerTimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof ScannerServerError) {
    console.error('Server error:', error.statusCode);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Advanced Usage

### Retry Configuration

```typescript
const client = new ScannerClient({
  apiKey: process.env.SCANNER_API_KEY!,
  maxRetries: 5,
  retryDelay: 2000,  // 2 seconds initial delay
});

// Exponential backoff: 2s, 4s, 8s, 16s, 32s
```

### Custom Timeout

```typescript
const result = await client.scanFile('./large-video.mp4', {
  timeout: 600000,  // 10 minutes for large files
});
```

### Webhook Notifications

```typescript
// Configure webhook URL (enterprise feature)
await client.configureWebhook({
  url: 'https://your-domain.com/scanner-webhook',
  events: ['scan.completed', 'scan.failed'],
  secret: 'your-webhook-secret',
});

// Start async scan
const { scan_id } = await client.startAsyncScan('./video.mp4');

// Your webhook will receive the result when ready
```

---

## Browser Usage

### Webpack/Vite

```typescript
import { ScannerClient } from '@scanner/sdk';

const client = new ScannerClient({
  apiKey: import.meta.env.VITE_SCANNER_API_KEY,
});

// Scan file from file input
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const buffer = await file.arrayBuffer();
  const result = await client.scanBuffer(Buffer.from(buffer), {
    filename: file.name,
  });
  console.log('Result:', result);
});
```

### Script Tag (UMD)

```html
<script src="https://unpkg.com/@scanner/sdk@5.0.0/dist/umd/scanner-sdk.min.js"></script>
<script>
  const client = new ScannerSDK.ScannerClient({
    apiKey: 'your-api-key-here',
  });

  async function scanFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const result = await client.scanBuffer(buffer, { filename: file.name });
    console.log('Verdict:', result.verdict);
  }
</script>
```

---

## Examples

### React Hook

```typescript
import { useState } from 'react';
import { ScannerClient, ScanResult } from '@scanner/sdk';

const client = new ScannerClient({ apiKey: process.env.REACT_APP_SCANNER_API_KEY! });

export function useScanMedia() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const scan = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const scanResult = await client.scanBuffer(Buffer.from(buffer), {
        filename: file.name,
      });
      setResult(scanResult);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { scan, loading, result, error };
}
```

### Node.js CLI

```typescript
#!/usr/bin/env node
import { ScannerClient } from '@scanner/sdk';

const client = new ScannerClient({ apiKey: process.env.SCANNER_API_KEY! });

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: scan-media <file>');
  process.exit(1);
}

const result = await client.scanFile(filePath);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Scan ID: ${result.scan_id}`);
console.log(`Verdict: ${result.verdict.toUpperCase()}`);
console.log(`Trust Score: ${(result.trust_score * 100).toFixed(1)}%`);
console.log(`Threat Level: ${result.threat_level}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (result.attribution?.generator_detected) {
  console.log(`\n🔍 Generator Detected: ${result.attribution.likely_tool}`);
  console.log(`   Confidence: ${(result.attribution.confidence * 100).toFixed(1)}%`);
}

if (result.pentashield.sentinel.physics_anomalies.length > 0) {
  console.log('\n⚠️  Physics Anomalies:');
  result.pentashield.sentinel.physics_anomalies.forEach(a => console.log(`   • ${a}`));
}

process.exit(result.verdict === 'fake' || result.verdict === 'likely_fake' ? 1 : 0);
```

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## License

Apache 2.0 — See [LICENSE](../../LICENSE) for details.

---

## Support

- **Documentation:** https://docs.scanner-ultra.ai
- **GitHub Issues:** https://github.com/AhmetSeyhan/scanner-ultra/issues
- **Discord:** https://discord.gg/scanner-ultra
- **Email:** support@scanner-tech.ai

---

**Built with ❤️ by Scanner Technologies**
