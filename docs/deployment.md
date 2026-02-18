# Scanner ULTRA — Deployment Guide

Complete guide for deploying Scanner ULTRA in production environments.

---

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Production](#kubernetes-production)
4. [Cloud Platforms](#cloud-platforms)
5. [Monitoring & Observability](#monitoring--observability)
6. [Security Hardening](#security-hardening)
7. [Scaling & Performance](#scaling--performance)
8. [Disaster Recovery](#disaster-recovery)

---

## 1. Local Development

### Prerequisites

- Python 3.10+ (3.12 recommended)
- 8GB+ RAM
- NVIDIA GPU (optional, CPU fallback available)
- CUDA 11.8+ (if using GPU)

### Installation

```bash
# Clone repository
git clone https://github.com/AhmetSeyhan/scanner-ultra.git
cd scanner-ultra

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations (if using PostgreSQL)
alembic upgrade head

# Start development server
uvicorn src.scanner.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src/scanner --cov-report=html

# Lint and format
ruff check src/
ruff format src/

# Type checking
pyright src/
```

---

## 2. Docker Deployment

### Single Container

```bash
# Build image
docker build -t scanner-ultra:5.0.0 .

# Run container
docker run -d \
  --name scanner-ultra \
  --gpus all \
  -p 8000:8000 \
  -e SCANNER_DATABASE_URL=postgresql://user:pass@postgres:5432/scanner \
  -e SCANNER_REDIS_URL=redis://redis:6379 \
  -v /path/to/weights:/app/weights \
  scanner-ultra:5.0.0
```

### Docker Compose (Recommended)

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f scanner-ultra

# Stop services
docker compose down
```

**Services included:**
- `scanner-ultra` — Main API (port 8000)
- `postgres` — Database (port 5432)
- `redis` — Cache & rate limiting (port 6379)
- `minio` — S3-compatible storage (port 9000)
- `qdrant` — Vector database (port 6333)
- `prometheus` — Metrics collection (port 9090)
- `grafana` — Dashboards (port 3000)

### Environment Variables

Create `.env` file:

```bash
# Core settings
SCANNER_ENVIRONMENT=production
SCANNER_LOG_LEVEL=INFO
SCANNER_DEBUG=false

# Database
SCANNER_DATABASE_URL=postgresql://scanner:changeme@postgres:5432/scanner

# Redis
SCANNER_REDIS_URL=redis://redis:6379/0

# Storage
SCANNER_S3_ENDPOINT=http://minio:9000
SCANNER_S3_ACCESS_KEY=minioadmin
SCANNER_S3_SECRET_KEY=minioadmin

# Security
SCANNER_API_KEY=your-secure-api-key-here
SCANNER_SECRET_KEY=your-secret-signing-key

# Rate limiting
SCANNER_RATE_LIMIT_PER_MINUTE=100

# Detectors
SCANNER_VISUAL_DETECTORS=clip,efficientnet,ppg_biosignal
SCANNER_AUDIO_DETECTORS=cqt,wavlm
SCANNER_TEXT_DETECTORS=ai_text

# GPU
SCANNER_USE_GPU=true
SCANNER_GPU_DEVICE=0

# Timeouts
SCANNER_DETECTOR_TIMEOUT=30
SCANNER_SCAN_TIMEOUT=300
```

---

## 3. Kubernetes Production

### Prerequisites

- Kubernetes 1.24+
- Helm 3.8+
- kubectl configured
- NVIDIA GPU operator (for GPU nodes)
- cert-manager (for TLS)

### Installation

```bash
# Add Helm repository (if published)
helm repo add scanner-ultra https://charts.scanner-tech.ai
helm repo update

# Or use local chart
cd deploy/kubernetes

# Install with default values
helm install scanner-ultra ./scanner-ultra \
  --namespace scanner \
  --create-namespace

# Install with custom values
helm install scanner-ultra ./scanner-ultra \
  --namespace scanner \
  --create-namespace \
  --values my-values.yaml
```

### Custom Values Example

Create `production-values.yaml`:

```yaml
replicaCount: 5

image:
  repository: ghcr.io/scanner-tech/scanner-ultra
  tag: "5.0.0"

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.scanner-ultra.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: scanner-tls
      hosts:
        - api.scanner-ultra.com

resources:
  limits:
    cpu: 4000m
    memory: 8Gi
    nvidia.com/gpu: 1
  requests:
    cpu: 2000m
    memory: 4Gi
    nvidia.com/gpu: 1

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector:
  accelerator: nvidia-tesla-t4

env:
  - name: SCANNER_ENVIRONMENT
    value: "production"
  - name: SCANNER_DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: scanner-secrets
        key: database-url
  - name: SCANNER_REDIS_URL
    value: "redis://scanner-redis:6379"

postgresql:
  enabled: true
  auth:
    username: scanner
    password: changeme  # Use external secret manager
    database: scanner
  primary:
    persistence:
      enabled: true
      size: 50Gi
    resources:
      requests:
        memory: 4Gi
        cpu: 2000m

redis:
  enabled: true
  architecture: standalone
  master:
    persistence:
      enabled: true
      size: 20Gi
```

### Deploy

```bash
helm install scanner-ultra ./scanner-ultra \
  --namespace scanner \
  --create-namespace \
  --values production-values.yaml
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n scanner

# Check services
kubectl get svc -n scanner

# Check ingress
kubectl get ingress -n scanner

# View logs
kubectl logs -n scanner deployment/scanner-ultra -f

# Health check
kubectl port-forward -n scanner svc/scanner-ultra 8000:8000
curl http://localhost:8000/v1/health
```

### Upgrade

```bash
# Pull latest chart
helm repo update

# Upgrade deployment
helm upgrade scanner-ultra ./scanner-ultra \
  --namespace scanner \
  --values production-values.yaml \
  --wait
```

### Rollback

```bash
# List revisions
helm history scanner-ultra -n scanner

# Rollback to previous version
helm rollback scanner-ultra -n scanner
```

---

## 4. Cloud Platforms

### AWS EKS

```bash
# Create EKS cluster
eksctl create cluster \
  --name scanner-ultra \
  --region us-west-2 \
  --nodegroup-name gpu-nodes \
  --node-type g4dn.xlarge \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10

# Install NVIDIA device plugin
kubectl create -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/main/nvidia-device-plugin.yml

# Deploy Scanner ULTRA
helm install scanner-ultra ./scanner-ultra \
  --namespace scanner \
  --create-namespace \
  --set nodeSelector."beta\.kubernetes\.io/instance-type"=g4dn.xlarge
```

### GCP GKE

```bash
# Create GKE cluster with GPU nodes
gcloud container clusters create scanner-ultra \
  --zone us-central1-a \
  --accelerator type=nvidia-tesla-t4,count=1 \
  --machine-type n1-standard-4 \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 10

# Install NVIDIA drivers
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/container-engine-accelerators/master/nvidia-driver-installer/cos/daemonset-preloaded.yaml

# Deploy Scanner ULTRA
helm install scanner-ultra ./scanner-ultra --namespace scanner
```

### Azure AKS

```bash
# Create AKS cluster with GPU nodes
az aks create \
  --resource-group scanner-rg \
  --name scanner-ultra \
  --node-count 3 \
  --node-vm-size Standard_NC6s_v3 \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 10

# Install NVIDIA device plugin
kubectl create -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/main/nvidia-device-plugin.yml

# Deploy Scanner ULTRA
helm install scanner-ultra ./scanner-ultra --namespace scanner
```

---

## 5. Monitoring & Observability

### Prometheus Setup

```bash
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

Prometheus will auto-discover Scanner ULTRA pods with annotations:

```yaml
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8000"
  prometheus.io/path: "/metrics"
```

### Grafana Dashboards

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Import dashboard
# Login (admin/prom-operator)
# Import deploy/monitoring/grafana-dashboard.json
```

**Key Metrics:**
- Request rate (req/s)
- Response time (p50, p95, p99)
- Detector success rate
- GPU utilization
- Memory usage
- Cache hit rate
- PentaShield overrides

### Logging

**Structured JSON logging:**

```python
# logs automatically include
{
  "timestamp": "2026-02-18T12:34:56Z",
  "level": "INFO",
  "message": "Scan completed",
  "scan_id": "scn_abc123",
  "verdict": "likely_fake",
  "processing_time_ms": 2847,
  "trace_id": "uuid",
  "user_id": "usr_xyz"
}
```

**Aggregation with ELK/Loki:**

```bash
# Install Loki
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set promtail.enabled=true
```

### Tracing

**OpenTelemetry integration:**

```python
# Automatic instrumentation
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

FastAPIInstrumentor.instrument_app(app)
```

---

## 6. Security Hardening

### TLS/SSL

```yaml
# cert-manager ClusterIssuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@scanner-tech.ai
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: scanner-ultra-netpol
spec:
  podSelector:
    matchLabels:
      app: scanner-ultra
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx-ingress
      ports:
        - protocol: TCP
          port: 8000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

### Secrets Management

**AWS Secrets Manager:**

```bash
# Store secrets
aws secretsmanager create-secret \
  --name scanner/database-url \
  --secret-string "postgresql://user:pass@host/db"

# Use External Secrets Operator
kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/crds/bundle.yaml
```

**Kubernetes Secrets (base64 encoded):**

```bash
kubectl create secret generic scanner-secrets \
  --from-literal=api-key=your-key \
  --from-literal=database-url=postgresql://... \
  --namespace scanner
```

---

## 7. Scaling & Performance

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: scanner-ultra-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: scanner-ultra
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### Vertical Pod Autoscaling

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: scanner-ultra-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: scanner-ultra
  updatePolicy:
    updateMode: "Auto"
```

### Performance Tuning

**GPU Optimization:**

```yaml
resources:
  limits:
    nvidia.com/gpu: 1  # 1 GPU per pod
  requests:
    nvidia.com/gpu: 1

# GPU sharing (if supported)
env:
  - name: NVIDIA_VISIBLE_DEVICES
    value: "0"
  - name: CUDA_VISIBLE_DEVICES
    value: "0"
```

**Connection Pooling:**

```python
# PostgreSQL connection pool
SQLALCHEMY_POOL_SIZE = 20
SQLALCHEMY_MAX_OVERFLOW = 40

# Redis connection pool
REDIS_MAX_CONNECTIONS = 50
```

**Async Workers:**

```bash
# Uvicorn workers
uvicorn src.scanner.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker
```

---

## 8. Disaster Recovery

### Backup Strategy

**Database Backups:**

```bash
# PostgreSQL automated backups
kubectl create cronjob postgres-backup \
  --image postgres:15 \
  --schedule="0 2 * * *" \
  -- pg_dump -h postgres -U scanner -d scanner | gzip > /backup/scanner-$(date +%F).sql.gz
```

**Model Weights Backup:**

```bash
# Sync weights to S3
aws s3 sync /app/weights s3://scanner-backups/weights/ --delete
```

### Restore Procedure

```bash
# Restore database
kubectl exec -it postgres-0 -- psql -U scanner -d scanner < backup.sql

# Restore weights
aws s3 sync s3://scanner-backups/weights/ /app/weights/
```

### High Availability

**Multi-Region Deployment:**

```yaml
# Active-Active setup
- Region: us-west-2 (primary)
- Region: eu-west-1 (secondary)
- Global Load Balancer: AWS Route53 / Cloudflare
```

**Database Replication:**

```yaml
postgresql:
  replication:
    enabled: true
    numSynchronousReplicas: 1
    synchronousCommit: "on"
```

---

## 9. Cost Optimization

### Resource Limits

```yaml
resources:
  limits:
    cpu: 4000m      # Prevent runaway usage
    memory: 8Gi
  requests:
    cpu: 2000m      # Guaranteed resources
    memory: 4Gi
```

### Spot/Preemptible Instances

```bash
# AWS EKS with Spot instances
eksctl create nodegroup \
  --cluster scanner-ultra \
  --name spot-nodes \
  --spot \
  --instance-types g4dn.xlarge \
  --nodes-min 2 \
  --nodes-max 10
```

### Cluster Autoscaler

```bash
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --set autoDiscovery.clusterName=scanner-ultra \
  --set awsRegion=us-west-2
```

---

## 10. Troubleshooting

### Common Issues

**1. OOM (Out of Memory)**

```bash
# Check memory usage
kubectl top pods -n scanner

# Increase memory limits
helm upgrade scanner-ultra ./scanner-ultra \
  --set resources.limits.memory=16Gi
```

**2. GPU not detected**

```bash
# Verify GPU nodes
kubectl get nodes -l accelerator=nvidia-tesla-t4

# Check NVIDIA device plugin
kubectl get daemonset -n kube-system nvidia-device-plugin-daemonset
```

**3. Slow inference**

```bash
# Check detector timeout
export SCANNER_DETECTOR_TIMEOUT=60

# Reduce concurrent scans
export SCANNER_MAX_CONCURRENT=12
```

---

## Support

- **Documentation:** https://docs.scanner-ultra.ai
- **GitHub Issues:** https://github.com/AhmetSeyhan/scanner-ultra/issues
- **Discord:** https://discord.gg/scanner-ultra
- **Enterprise Support:** enterprise@scanner-tech.ai
