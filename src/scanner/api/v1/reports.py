"""Scanner ULTRA — Reports endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from scanner.api.auth.middleware import verify_api_key
from scanner.api.v1.results import _results_cache

router = APIRouter()


@router.post("/reports/{scan_id}")
async def generate_report(
    scan_id: str,
    api_key: str = Depends(verify_api_key),
) -> dict:
    """Generate a forensic report for a completed scan."""
    if scan_id not in _results_cache:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    # Placeholder — full PDF generation in FAZ 5
    return {
        "scan_id": scan_id,
        "report_type": "json",
        "message": "PDF report generation available in enterprise tier",
        "data": _results_cache[scan_id],
    }
