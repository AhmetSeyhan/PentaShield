# Scanner ULTRA v5.0.0 — PentaShield™ Edition

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com)

Advanced multi-modal deepfake detection platform with **5 proprietary defense technologies**.

## 🌟 Features

### PentaShield™ Defense Technologies

1. **🧬 HYDRA ENGINE** — Adversarial-Immune Multi-Head Detection
   - Self-adversarial training loop
   - 3 independent decision heads
   - Minority report dissent tracking
   - Gradient masking protection

2. **🔮 ZERO-DAY SENTINEL** — Novel Deepfake Discovery
   - Out-of-distribution anomaly detection
   - Physics-based verification (lighting, shadows, reflections)
   - Biological consistency checks
   - Real-time threat level assessment

3. **🔬 FORENSIC DNA** — Generator Fingerprinting & Attribution
   - Spectral analysis (FFT/DCT)
   - 7 generator families (StyleGAN2, Stable Diffusion, etc.)
   - Source attribution reports
   - Court-admissible forensic evidence

4. **⚡ ACTIVE PROBE** — Challenge-Response Liveness
   - Real-time WebRTC challenges
   - Light reflection verification
   - Motion consistency checks
   - Latency analysis (<50ms real, >800ms fake)

5. **📱 GHOST PROTOCOL** — Edge AI & Privacy-Preserving Learning
   - Tiny models (<10MB, <100ms inference)
   - Federated learning (FedAvg)
   - Differential privacy (ε-DP)
   - Continual learning (EWC)

### Core Detection

- **10 Visual Detectors**: CLIP, EfficientNet, Xception, ViT, Frequency, GAN/Diffusion artifacts, PPG biosignal, Gaze
- **6 Audio Detectors**: WavLM, ECAPA-TDNN, CQT spectrogram, Voice clone, SyncNet
- **3 Text Detectors**: AI text, Stylometric, Perplexity
- **4 Fusion Modules**: Cross-modal attention, Temporal consistency, Confidence calibration, Trust score
- **3 Defense Layers**: Hash DB, Provenance (C2PA/EXIF), Metadata forensics

---

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/AhmetSeyhan/scanner-ultra.git
cd scanner-ultra

# Install dependencies
pip install -e ".[dev]"

# Run API server
uvicorn src.scanner.main:app --reload

# Run tests
pytest tests/ -v
```

### Docker

```bash
# Start all services
docker compose up -d

# Check health
curl http://localhost:8000/v1/health
```

### Kubernetes (Production)

```bash
# Deploy with Helm
helm install scanner-ultra ./deploy/kubernetes/scanner-ultra \
  --namespace scanner \
  --create-namespace

# Check status
kubectl get pods -n scanner
```

---

## 📡 API Usage

### REST API

```bash
# Scan a video
curl -X POST http://localhost:8000/v1/scan \
  -H "X-API-Key: your-key" \
  -F "file=@video.mp4"

# Response
{
  "scan_id": "scn_abc123",
  "verdict": "likely_fake",
  "trust_score": 0.12,
  "confidence": 0.94,
  "threat_level": "high",
  "pentashield": {
    "hydra": {...},
    "sentinel": {...},
    "forensic_dna": {...},
    "active_probe": {...},
    "ghost_protocol": {...}
  }
}
```

### Python SDK

```python
from scanner_sdk import ScannerClient

client = ScannerClient(api_key="your-key")
result = client.scan_file("video.mp4")

print(f"Verdict: {result.verdict}")
print(f"Trust Score: {result.trust_score:.2%}")
```

### JavaScript/TypeScript SDK

```typescript
import { ScannerClient } from '@scanner/sdk';

const client = new ScannerClient({ apiKey: 'your-key' });
const result = await client.scanFile('./video.mp4');

console.log(`Verdict: ${result.verdict}`);
```

### Browser Extension

Install Scanner ULTRA extension for Chrome/Firefox:
- Automatic detection of web media
- Right-click context menu analysis
- Real-time overlay badges

---

## 🏗️ Architecture

```
Scanner ULTRA v5.0.0
├── API Layer (FastAPI)
│   ├── /v1/scan              # Multi-modal scan
│   ├── /v1/challenge/*       # Active probe (real-time)
│   ├── /v1/results/{id}      # Get scan result
│   └── /v1/health            # Health check
│
├── PentaShield™ Technologies
│   ├── HYDRA ENGINE          # Adversarial defense
│   ├── ZERO-DAY SENTINEL     # Anomaly detection
│   ├── FORENSIC DNA          # Generator fingerprinting
│   ├── ACTIVE PROBE          # Liveness verification
│   └── GHOST PROTOCOL        # Edge AI + Federated learning
│
├── Core Detection (19 detectors)
│   ├── Visual (10)           # CLIP, EfficientNet, ViT, etc.
│   ├── Audio (6)             # WavLM, CQT, SyncNet, etc.
│   └── Text (3)              # AI text, Stylometric, etc.
│
├── Fusion Layer
│   ├── Cross-modal attention
│   ├── Temporal consistency
│   └── Trust score engine
│
└── Enterprise Features
    ├── SDK (Python + JavaScript)
    ├── Browser Extension
    ├── Kubernetes deployment
    ├── Monitoring (Prometheus + Grafana)
    └── Auto-scaling (HPA)
```

---

## 📚 Documentation

- **[API Reference](docs/api-reference.md)** — REST API documentation
- **[PentaShield Whitepaper](docs/pentashield-whitepaper.md)** — Technical deep-dive
- **[Python SDK](sdk/python/README.md)** — Python client library
- **[JavaScript SDK](sdk/javascript/README.md)** — JS/TS client library
- **[Deployment Guide](docs/deployment.md)** — Kubernetes & production setup
- **[Architecture](docs/architecture.md)** — System design & components

---

## 🔧 Development

### Project Structure

```
scanner-ultra/
├── src/scanner/              # Main application
│   ├── api/                  # REST API endpoints
│   ├── core/                 # Detection engines
│   ├── pentashield/          # PentaShield technologies
│   ├── models/               # Schemas & types
│   └── preprocessing/        # Media processing
│
├── sdk/                      # Client SDKs
│   ├── python/               # Python SDK
│   └── javascript/           # JS/TS SDK
│
├── integrations/             # Platform integrations
│   ├── browser-extension/    # Chrome/Firefox extension
│   ├── zoom/                 # Zoom plugin (planned)
│   └── teams/                # MS Teams plugin (planned)
│
├── deploy/                   # Deployment configs
│   ├── kubernetes/           # Helm charts
│   └── monitoring/           # Prometheus/Grafana
│
└── tests/                    # Test suite (116+ tests)
```

### Running Tests

```bash
# All tests
pytest tests/ -v

# Specific module
pytest tests/test_ghost_protocol.py -v

# With coverage
pytest tests/ --cov=src/scanner --cov-report=html
```

### Code Quality

```bash
# Lint
ruff check .

# Format
ruff format .

# Type check
pyright src/
```

---

## 📊 Performance

- **Throughput**: 50+ scans/min (single GPU)
- **Latency**: <3s (video), <500ms (image)
- **Accuracy**: 97%+ on FaceForensics++, Celeb-DF
- **Edge Inference**: <100ms (mobile devices)
- **GPU Memory**: ~4GB per model
- **Auto-scaling**: 2-10 replicas (Kubernetes HPA)

---

## 🛡️ Security & Privacy

- **API Key Authentication** — Header-based auth
- **Rate Limiting** — Redis-backed, configurable tiers
- **Differential Privacy** — ε-DP (ε=1.0, δ=1e-5)
- **Federated Learning** — No raw data sharing
- **GDPR/KVKK Compliant** — Privacy budget tracking
- **Audit Logging** — Comprehensive activity logs

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📜 License

Apache 2.0 — See [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **GitHub**: https://github.com/AhmetSeyhan/scanner-ultra
- **Documentation**: https://docs.scanner-ultra.ai
- **API Reference**: https://api.scanner-ultra.ai/docs
- **Discord**: https://discord.gg/scanner-ultra

---

**Built with ❤️ by Scanner Technologies**
