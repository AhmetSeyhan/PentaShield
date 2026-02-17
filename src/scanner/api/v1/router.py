"""Scanner ULTRA — v1 API router aggregator."""

from fastapi import APIRouter

from scanner.api.v1 import challenge, health, reports, results, scan

v1_router = APIRouter(prefix="/v1", tags=["v1"])

v1_router.include_router(health.router)
v1_router.include_router(scan.router)
v1_router.include_router(results.router)
v1_router.include_router(reports.router)
v1_router.include_router(challenge.router)
