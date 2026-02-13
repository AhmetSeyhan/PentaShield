"""Tests for API endpoints."""

import pytest


@pytest.mark.asyncio
async def test_root(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Scanner ULTRA"
    assert data["status"] == "operational"


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == "5.0.0"


@pytest.mark.asyncio
async def test_scan_no_file(client, api_key):
    resp = await client.post("/v1/scan", headers={"X-API-Key": api_key})
    assert resp.status_code == 422  # missing file


@pytest.mark.asyncio
async def test_scan_with_file(client, api_key):
    resp = await client.post(
        "/v1/scan",
        headers={"X-API-Key": api_key},
        files={"file": ("test.jpg", b"\xff\xd8\xff\xe0" + b"\x00" * 100, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["scan_id"].startswith("scn_")
    assert data["media_type"] == "image"
    assert "verdict" in data


@pytest.mark.asyncio
async def test_result_not_found(client, api_key):
    resp = await client.get("/v1/results/nonexistent", headers={"X-API-Key": api_key})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_scan_then_get_result(client, api_key):
    # Scan
    resp = await client.post(
        "/v1/scan",
        headers={"X-API-Key": api_key},
        files={"file": ("test.png", b"\x89PNG" + b"\x00" * 100, "image/png")},
    )
    assert resp.status_code == 200
    scan_id = resp.json()["scan_id"]

    # Get result
    resp2 = await client.get(f"/v1/results/{scan_id}", headers={"X-API-Key": api_key})
    assert resp2.status_code == 200
    assert resp2.json()["scan_id"] == scan_id
