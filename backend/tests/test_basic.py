from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_login_lookup():
    email = "test1@example.com"
    # cleanup not handled; use unique email
    import uuid
    email = f"t{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == email
    # register device
    r = client.post("/api/v1/devices/register", json={
        "device_type": "phone",
        "identifier_type": "imei",
        "identifier_value": "490154203237518",
    }, headers=headers)
    assert r.status_code == 200, r.text
    # public lookup
    r = client.get("/api/v1/devices/lookup", params={"identifier": "490154203237518"})
    assert r.status_code == 200
    assert r.json()["effective_status"] == "No active theft restriction found"
    # invalid IMEI
    r = client.post("/api/v1/devices/register", json={
        "device_type": "phone",
        "identifier_type": "imei",
        "identifier_value": "123456789012345",
    }, headers=headers)
    assert r.status_code == 400
