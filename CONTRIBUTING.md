# Contributing to Scanner ULTRA

Thank you for your interest in contributing to Scanner ULTRA! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Bug Reports](#bug-reports)
8. [Feature Requests](#feature-requests)
9. [Security Issues](#security-issues)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We do not tolerate harassment or discrimination of any kind.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, intimidation, or discrimination
- Trolling, insulting/derogatory comments, personal or political attacks
- Public or private harassment
- Publishing others' private information without permission

### Enforcement

Violations of the Code of Conduct may be reported to conduct@scanner-tech.ai. All complaints will be reviewed and investigated promptly and fairly.

---

## How Can I Contribute?

### Types of Contributions

1. **Bug Reports** — Found a bug? Report it!
2. **Bug Fixes** — Fix existing issues
3. **New Detectors** — Add new detection modules
4. **Documentation** — Improve docs, tutorials, examples
5. **Performance** — Optimize existing code
6. **Tests** — Increase test coverage
7. **Features** — Propose and implement new features

### Areas Needing Help

Check issues labeled:
- `good first issue` — Good for newcomers
- `help wanted` — Community contributions welcome
- `documentation` — Docs improvements needed
- `performance` — Optimization opportunities

---

## Development Setup

### Prerequisites

- Python 3.10+ (3.12 recommended)
- Git
- NVIDIA GPU (optional, CPU fallback available)
- CUDA 11.8+ (if using GPU)

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/scanner-ultra.git
cd scanner-ultra

# Add upstream remote
git remote add upstream https://github.com/AhmetSeyhan/scanner-ultra.git
```

### Install Dependencies

```bash
# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install in editable mode with dev dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
```

### Run Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src/scanner --cov-report=html

# Open coverage report
open htmlcov/index.html  # macOS
# or
xdg-open htmlcov/index.html  # Linux
# or
start htmlcov/index.html  # Windows
```

### Run Locally

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
uvicorn src.scanner.main:app --reload --port 8000

# Access API docs
open http://localhost:8000/docs
```

---

## Coding Standards

### Python Style Guide

We follow **PEP 8** with some modifications:

- **Line length:** 100 characters (not 79)
- **Quotes:** Double quotes `"` for strings
- **Imports:** Absolute imports, grouped (stdlib, third-party, local)
- **Type hints:** Required for all public functions
- **Docstrings:** Google-style docstrings

### Linting

We use **Ruff** for linting and formatting:

```bash
# Lint code
ruff check src/

# Auto-fix issues
ruff check src/ --fix

# Format code
ruff format src/
```

### Type Checking

We use **Pyright** for static type checking:

```bash
pyright src/
```

### Code Example

```python
"""Module docstring describing the file."""

from __future__ import annotations  # Enable PEP 563

import asyncio
from pathlib import Path
from typing import Any

import numpy as np

from scanner.core.base_detector import BaseDetector, DetectorInput, DetectorResult


class MyDetector(BaseDetector):
    """Short description of the detector.

    Longer description explaining what it does, how it works, and any
    important implementation details.

    Attributes:
        model: The underlying ML model.
        threshold: Detection threshold (default 0.5).
    """

    def __init__(self, threshold: float = 0.5) -> None:
        """Initialize the detector.

        Args:
            threshold: Detection threshold between 0.0 and 1.0.

        Raises:
            ValueError: If threshold is not in [0, 1].
        """
        super().__init__()
        if not 0 <= threshold <= 1:
            raise ValueError(f"Threshold must be in [0, 1], got {threshold}")
        self.threshold = threshold
        self.model = None

    async def load_model(self) -> None:
        """Load the model weights asynchronously."""
        # Implementation here
        pass

    async def detect(self, input: DetectorInput) -> DetectorResult:
        """Run detection on the input.

        Args:
            input: The detector input containing frames/audio/text.

        Returns:
            Detection result with score, confidence, and details.

        Raises:
            RuntimeError: If model is not loaded.
        """
        await self.ensure_loaded()

        # Process input
        frames = input.frames
        if frames is None:
            return DetectorResult(score=0.5, confidence=0.0, method="no_input")

        # Run inference
        score = self._compute_score(frames)
        confidence = self._compute_confidence(score)

        return DetectorResult(
            score=score,
            confidence=confidence,
            method=self.__class__.__name__,
            details={"threshold": self.threshold},
        )

    def _compute_score(self, frames: list[np.ndarray]) -> float:
        """Compute detection score from frames.

        Args:
            frames: List of video frames.

        Returns:
            Detection score between 0.0 (authentic) and 1.0 (fake).
        """
        # Implementation here
        return 0.5

    def _compute_confidence(self, score: float) -> float:
        """Compute confidence from score.

        Args:
            score: Detection score.

        Returns:
            Confidence between 0.0 (low) and 1.0 (high).
        """
        # Distance from decision boundary (0.5)
        return 1.0 - 2.0 * abs(score - 0.5)
```

### Testing Requirements

All new code must include tests:

- **Unit tests:** Test individual functions/classes
- **Integration tests:** Test component interactions
- **Coverage:** Aim for >80% coverage
- **Test naming:** `test_<function>_<scenario>`

**Test Example:**

```python
import pytest
from scanner.core.my_detector import MyDetector


class TestMyDetector:
    """Test suite for MyDetector."""

    @pytest.fixture
    def detector(self):
        """Create detector instance for tests."""
        return MyDetector(threshold=0.6)

    def test_init_valid_threshold(self):
        """Test initialization with valid threshold."""
        detector = MyDetector(threshold=0.5)
        assert detector.threshold == 0.5

    def test_init_invalid_threshold(self):
        """Test initialization with invalid threshold raises ValueError."""
        with pytest.raises(ValueError, match="Threshold must be in"):
            MyDetector(threshold=1.5)

    @pytest.mark.asyncio
    async def test_detect_no_frames(self, detector):
        """Test detection with no frames returns default result."""
        from scanner.core.base_detector import DetectorInput

        input = DetectorInput(frames=None, audio=None, text=None)
        result = await detector.detect(input)

        assert result.score == 0.5
        assert result.confidence == 0.0

    @pytest.mark.asyncio
    async def test_detect_with_frames(self, detector, sample_frames):
        """Test detection with valid frames."""
        input = DetectorInput(frames=sample_frames, audio=None, text=None)
        result = await detector.detect(input)

        assert 0.0 <= result.score <= 1.0
        assert 0.0 <= result.confidence <= 1.0
        assert result.method == "MyDetector"
```

---

## Commit Guidelines

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Code style (formatting, no logic change)
- `refactor` — Code refactoring
- `perf` — Performance improvement
- `test` — Add or update tests
- `chore` — Build process, dependencies, tooling
- `ci` — CI/CD changes

**Scopes:**
- `core` — Core detection modules
- `pentashield` — PentaShield technologies
- `api` — API layer
- `sdk` — Python/JavaScript SDK
- `deployment` — Kubernetes, Docker
- `docs` — Documentation

**Examples:**

```bash
feat(core): add CLIP-based visual detector

Implements CLIP detector with LayerNorm-only fine-tuning for better
generalization. Uses OpenAI's CLIP model pre-trained on 400M image-text
pairs.

Closes #42
```

```bash
fix(pentashield): correct physics verifier lighting calculation

The left/right brightness ratio was inverted, causing false positives.
Fixed by swapping the numerator and denominator.

Fixes #127
```

```bash
docs(api): add examples for challenge-response API

Added comprehensive examples for /v1/challenge/* endpoints with code
snippets in Python, JavaScript, and cURL.
```

### Commit Message Guidelines

- **Use imperative mood** — "add" not "added" or "adds"
- **Capitalize first letter** — "Add feature" not "add feature"
- **No period at end** — "Add feature" not "Add feature."
- **Body explains "why"** — Not "what" (code shows what)
- **Reference issues** — `Closes #42`, `Fixes #127`, `Refs #88`

---

## Pull Request Process

### Before Submitting

1. **Create an issue first** (for non-trivial changes)
2. **Fork the repository**
3. **Create a feature branch**
4. **Make your changes**
5. **Add tests** (maintain >80% coverage)
6. **Update docs** (if applicable)
7. **Lint and format**
8. **Run tests locally**

### PR Checklist

- [ ] Tests pass (`pytest tests/`)
- [ ] Linting passes (`ruff check src/`)
- [ ] Type checking passes (`pyright src/`)
- [ ] Coverage >80% (`pytest --cov`)
- [ ] Docs updated (if applicable)
- [ ] Changelog updated (for user-facing changes)
- [ ] Conventional commit messages
- [ ] PR description explains "why"

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Motivation
Why is this change needed? What problem does it solve?

## Changes
- List of changes
- Another change

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Docs updated
- [ ] Changelog updated

## Screenshots (if applicable)
Add screenshots for UI changes.

Closes #issue_number
```

### Review Process

1. **Automated checks** — CI/CD must pass
2. **Code review** — At least 1 maintainer approval
3. **Feedback addressed** — Respond to review comments
4. **Squash and merge** — We use squash merging

### After Merge

- Delete your feature branch
- Pull latest from upstream
- Close related issues (if not auto-closed)

---

## Bug Reports

### Before Reporting

1. **Search existing issues** — Issue may already exist
2. **Check latest version** — Bug may be fixed
3. **Minimal reproduction** — Simplify to smallest example

### Bug Report Template

```markdown
**Describe the bug**
Clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Minimal code example**
```python
# Minimal code to reproduce the issue
```

**Environment**
- Scanner ULTRA version: [e.g., 5.0.0]
- Python version: [e.g., 3.12.0]
- OS: [e.g., Ubuntu 22.04]
- GPU: [e.g., NVIDIA Tesla T4]

**Logs/Error messages**
```
Paste relevant logs here
```

**Additional context**
Any other relevant information.
```

---

## Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Use case**
How would you use this feature?

**Additional context**
Screenshots, mockups, or other context.
```

---

## Security Issues

**DO NOT** report security vulnerabilities in public issues.

Instead, email: security@scanner-tech.ai

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

See [SECURITY.md](SECURITY.md) for our security policy.

---

## Recognition

Contributors are recognized in:
- `CHANGELOG.md` — For each release
- GitHub contributors page
- Annual contributor highlights

Top contributors may be invited to join the core team.

---

## Questions?

- **Discord:** https://discord.gg/scanner-ultra
- **GitHub Discussions:** https://github.com/AhmetSeyhan/scanner-ultra/discussions
- **Email:** opensource@scanner-tech.ai

---

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

---

**Thank you for contributing to Scanner ULTRA!** 🚀
