"""Scanner ULTRA — Results endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from scanner.api.auth.middleware import verify_api_key
from scanner.models.schemas import ScanResult

router = APIRouter()

# In-memory result cache (replaced by Redis in production)
_results_cache: dict[str, dict] = {}


def store_result(scan_id: str, result: dict) -> None:
    """Store a scan result (called by orchestrator)."""
    _results_cache[scan_id] = result


@router.get("/results/{scan_id}", response_model=ScanResult)
async def get_result(
    scan_id: str,
    api_key: str = Depends(verify_api_key),
) -> ScanResult:
    """Retrieve a scan result by ID."""
    if scan_id not in _results_cache:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    return ScanResult(**_results_cache[scan_id])
