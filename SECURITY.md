# Security Policy

## Supported Versions

Security updates are provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 5.0.x   | :white_check_mark: |
| 4.x.x   | :x:                |
| 3.x.x   | :x:                |
| < 3.0   | :x:                |

**We strongly recommend always using the latest stable release.**

---

## Reporting a Vulnerability

**DO NOT** report security vulnerabilities through public GitHub issues.

### Security Contact

Please report security vulnerabilities to:

**Email:** security@scanner-tech.ai

**PGP Key:** Available at https://scanner-tech.ai/.well-known/pgp-key.asc

### What to Include

When reporting a vulnerability, please include:

1. **Description** — Detailed description of the vulnerability
2. **Impact** — What an attacker could achieve
3. **Steps to Reproduce** — Clear, step-by-step instructions
4. **Affected Versions** — Which versions are vulnerable
5. **Proof of Concept** — Code, screenshots, or video (if applicable)
6. **Suggested Fix** — If you have ideas (optional)
7. **Your Contact Info** — How we can reach you for follow-up

### Response Timeline

We take security seriously and follow this timeline:

- **24 hours** — Initial acknowledgment of your report
- **7 days** — Preliminary assessment and severity classification
- **30 days** — Fix developed, tested, and deployed
- **Disclosure** — Public disclosure after fix is released (coordinated with reporter)

### Severity Classification

We use CVSS 3.1 scoring:

- **Critical (9.0-10.0)** — Immediate action, emergency patch
- **High (7.0-8.9)** — Urgent fix, released within 7 days
- **Medium (4.0-6.9)** — Fix in next regular release
- **Low (0.1-3.9)** — Fix when convenient

### Bug Bounty Program

We offer rewards for qualifying vulnerabilities:

| Severity | Reward Range |
|----------|--------------|
| Critical | $5,000 - $10,000 |
| High     | $2,000 - $5,000 |
| Medium   | $500 - $2,000 |
| Low      | $100 - $500 |

**Qualifying vulnerabilities:**
- Remote code execution (RCE)
- SQL injection
- Authentication bypass
- Authorization bypass
- Server-side request forgery (SSRF)
- Cross-site scripting (XSS) with impact
- Adversarial attack that bypasses HYDRA Engine
- Model poisoning in federated learning
- Privacy leak in differential privacy implementation
- PentaShield override bypass

**Non-qualifying:**
- Denial of Service (DoS)
- Rate limiting bypass
- Self-XSS
- Social engineering
- Physical attacks
- Issues in outdated versions
- Theoretical attacks without PoC

---

## Security Best Practices

### For Users

#### API Key Management

```bash
# ✅ GOOD: Use environment variables
export SCANNER_API_KEY="scn_live_abc123..."
python scan.py

# ❌ BAD: Hardcoded in source
api_key = "scn_live_abc123..."  # DO NOT DO THIS
```

#### TLS/SSL

```python
# ✅ GOOD: Enforce HTTPS
client = ScannerClient(
    api_key=os.getenv("SCANNER_API_KEY"),
    base_url="https://api.scanner-ultra.ai"  # HTTPS
)

# ❌ BAD: Plaintext HTTP (development only!)
client = ScannerClient(
    api_key=os.getenv("SCANNER_API_KEY"),
    base_url="http://api.scanner-ultra.ai"  # INSECURE
)
```

#### Input Validation

```python
# ✅ GOOD: Validate file size
MAX_SIZE = 100 * 1024 * 1024  # 100 MB
if file.size > MAX_SIZE:
    raise ValueError("File too large")

# ✅ GOOD: Validate file type
ALLOWED_TYPES = {"video/mp4", "image/jpeg", "image/png"}
if file.content_type not in ALLOWED_TYPES:
    raise ValueError("Invalid file type")
```

#### Rate Limiting

```python
# ✅ GOOD: Respect rate limits
from scanner_sdk import ScannerRateLimitError

try:
    result = client.scan_file("video.mp4")
except ScannerRateLimitError as e:
    time.sleep(e.retry_after)
    result = client.scan_file("video.mp4")
```

### For Developers

#### Secrets in Code

```bash
# ✅ GOOD: Use environment variables
SCANNER_API_KEY=scn_test_xyz789

# ✅ GOOD: Use secrets management
# AWS Secrets Manager, HashiCorp Vault, etc.
api_key = secrets_manager.get_secret("scanner/api-key")

# ❌ BAD: Committed to Git
git add .env  # DO NOT COMMIT .env FILES
```

#### SQL Injection Prevention

```python
# ✅ GOOD: Parameterized queries
cursor.execute(
    "SELECT * FROM scans WHERE user_id = %s",
    (user_id,)  # Parameterized
)

# ❌ BAD: String concatenation
cursor.execute(
    f"SELECT * FROM scans WHERE user_id = '{user_id}'"  # VULNERABLE
)
```

#### Authentication

```python
# ✅ GOOD: Validate API key
async def validate_api_key(api_key: str) -> User | None:
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    user = await db.get_user_by_key_hash(key_hash)
    if not user:
        raise HTTPException(401, "Invalid API key")
    return user

# ❌ BAD: Plain comparison
if api_key == "scn_live_abc123":  # INSECURE
    pass
```

#### Logging

```python
# ✅ GOOD: Redact sensitive data
logger.info(f"Scan completed", extra={
    "scan_id": scan_id,
    "user_id": user_id,
    "api_key": "***REDACTED***"  # Don't log API keys
})

# ❌ BAD: Log sensitive data
logger.info(f"API key: {api_key}")  # NEVER LOG SECRETS
```

---

## Security Features

### Implemented Protections

#### 1. API Security

- **Authentication** — API key-based (SHA-256 hashed in DB)
- **Rate Limiting** — Redis-backed sliding window (10-100 req/min)
- **CORS** — Configurable allowed origins
- **TLS 1.3** — Enforced in production
- **Request validation** — Pydantic schemas

#### 2. Infrastructure Security

- **Pod Security Policies** — Read-only root filesystem, non-root user
- **Network Policies** — Restrict inter-pod communication
- **Secrets Management** — Kubernetes Secrets, external secrets operator
- **Resource Limits** — CPU/memory limits prevent DoS
- **Image Scanning** — Trivy for container vulnerabilities

#### 3. Data Security

- **Encryption at Rest** — PostgreSQL (AES-256), S3 (SSE-S3)
- **Encryption in Transit** — TLS 1.3 for all connections
- **Data Retention** — Automatic 7-day cleanup of uploaded media
- **PII Handling** — Minimal data collection, GDPR/KVKK compliant
- **Audit Logging** — Immutable append-only logs

#### 4. Application Security

- **Input Validation** — File size, type, content validation
- **SQL Injection Protection** — Parameterized queries (SQLAlchemy)
- **XSS Protection** — Content Security Policy headers
- **CSRF Protection** — SameSite cookies (if using sessions)
- **Dependency Scanning** — Dependabot for CVEs

#### 5. AI/ML Security

- **Adversarial Defense** — HYDRA Engine (input purification)
- **Model Integrity** — SHA-256 checksums for weights
- **Differential Privacy** — ε-DP (ε=1.0, δ=1e-5) in federated learning
- **Secure Aggregation** — Encrypted gradients in FedAvg
- **Model Watermarking** — Ownership verification

---

## Known Limitations

### Not Protected Against

1. **Physical Attacks** — Assumes secure infrastructure
2. **Insider Threats** — Assumes trusted operators
3. **Social Engineering** — User responsibility
4. **Zero-Day OS Vulnerabilities** — Depends on upstream patches
5. **Quantum Computing** — Current crypto not quantum-safe

### Planned Improvements

- **Multi-Factor Authentication (MFA)** — Q2 2026
- **JWT Authentication** — Alternative to API keys (Q2 2026)
- **Webhook Signature Verification** — HMAC-SHA256 (Q3 2026)
- **Content Security Policy (CSP)** — Stricter headers (Q3 2026)
- **Post-Quantum Cryptography** — Migration plan (Q4 2026)

---

## Security Audits

### External Audits

- **2025-12-15** — Penetration testing by CyberSec Labs (clean report)
- **2026-01-20** — Code audit by Trail of Bits (3 medium issues fixed)

### Internal Reviews

- Quarterly security reviews by core team
- Automated dependency scanning (GitHub Dependabot)
- Container vulnerability scanning (Trivy in CI/CD)

### Compliance

- **SOC 2 Type II** — In progress (expected Q3 2026)
- **GDPR** — Compliant (data minimization, right to erasure)
- **KVKK** — Compliant (Turkish data protection law)
- **CCPA** — Compliant (do-not-sell opt-out)

---

## Incident Response

### In Case of Breach

1. **Immediate Actions**
   - Isolate affected systems
   - Preserve forensic evidence
   - Notify security team

2. **Assessment** (within 24 hours)
   - Determine scope of breach
   - Identify compromised data
   - Classify severity

3. **Containment** (within 48 hours)
   - Patch vulnerability
   - Rotate credentials
   - Update firewall rules

4. **Notification** (within 72 hours, GDPR requirement)
   - Notify affected users
   - Report to regulators (if required)
   - Public disclosure (if critical)

5. **Recovery**
   - Restore from backups
   - Verify system integrity
   - Monitor for reinfection

6. **Post-Incident**
   - Root cause analysis
   - Update security policies
   - Employee training

### Contact for Incidents

**Emergency:** security@scanner-tech.ai (monitored 24/7)

---

## Security Hall of Fame

We recognize security researchers who have responsibly disclosed vulnerabilities:

### 2026

- **[Placeholder]** — Reported [Vulnerability] (Fixed in v5.0.1)

*Thank you for making Scanner ULTRA more secure!*

---

## Resources

- **Security Guide:** https://docs.scanner-ultra.ai/security
- **Hardening Checklist:** https://docs.scanner-ultra.ai/hardening
- **Compliance Docs:** https://scanner-tech.ai/compliance

---

**Last Updated:** February 18, 2026
**Security Team:** security@scanner-tech.ai
