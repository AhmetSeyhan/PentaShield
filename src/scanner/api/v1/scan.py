"""Scanner ULTRA — Scan endpoint."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, Form, UploadFile

from scanner.api.auth.middleware import verify_api_key
from scanner.models.schemas import ScanResult

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/scan", response_model=ScanResult)
async def scan_media(
    file: UploadFile = File(...),
    media_type: str | None = Form(None),
    api_key: str = Depends(verify_api_key),
) -> ScanResult:
    """Unified scan endpoint — auto-detects media type and runs pipeline."""
    from scanner.core.orchestrator import ScanOrchestrator

    orchestrator = ScanOrchestrator()
    content = await file.read()

    result = await orchestrator.scan(
        content=content,
        filename=file.filename or "unknown",
        media_type_hint=media_type,
    )
    return result
