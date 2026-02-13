# Scanner ULTRA v5.0.0 — PentaShield Edition

Advanced multi-modal deepfake detection engine with 5 proprietary defense technologies.

## Quick Start

```bash
# Install
pip install -e ".[dev]"

# Run API
make run

# Run tests
make test

# Docker
docker compose up -d
```

## API

```bash
# Health check
curl http://localhost:8000/v1/health

# Scan a file
curl -X POST http://localhost:8000/v1/scan \
  -H "X-API-Key: your-key" \
  -F "file=@video.mp4"

# Get result
curl http://localhost:8000/v1/results/{scan_id} \
  -H "X-API-Key: your-key"
```

## Architecture

```
src/scanner/
├── api/v1/          # REST API (FastAPI)
├── core/            # Detection engines
│   ├── visual/      # 10 visual detectors
│   ├── audio/       # 6 audio detectors
│   ├── text/        # 3 text detectors
│   ├── fusion/      # Cross-modal fusion
│   └── defense/     # Hash DB, provenance
├── models/          # Schemas, registry, enums
├── preprocessing/   # Media processing
└── storage/         # Redis, DB, S3
```

## License

Apache 2.0
