from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def make_imei(base14: str) -> str:
    total = 0
    for i, ch in enumerate(reversed(base14)):
        d = int(ch)
        if i % 2 == 0:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    check = (10 - (total % 10)) % 10
    return base14 + str(check)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_login_lookup():
    import uuid
    email = f"t{uuid.uuid4().hex[:8]}@example.com"
    import random
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == email
    r = client.post("/api/v1/devices/register", json={
        "device_type": "phone",
        "identifier_type": "imei",
        "identifier_value": imei,
    }, headers=headers)
    assert r.status_code == 200, r.text
    r = client.get("/api/v1/devices/lookup", params={"identifier": imei})
    assert r.status_code == 200
    assert r.json()["effective_status"] == "No active theft restriction found"
    r = client.post("/api/v1/devices/register", json={
        "device_type": "phone",
        "identifier_type": "imei",
        "identifier_value": "123456789012345",
    }, headers=headers)
    assert r.status_code == 400


def test_theft_report():
    import uuid
    email = f"t{uuid.uuid4().hex[:8]}@example.com"
    import random
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/v1/devices/register", json={
        "device_type": "phone",
        "identifier_type": "imei",
        "identifier_value": imei,
    }, headers=headers)
    assert r.status_code == 200, r.text
    r = client.post("/api/v1/theft-reports", json={
        "identifier_value": imei,
        "allegation_category": "lost",
        "description": "phone stolen",
    }, headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["duplicate"] is False
    r2 = client.post("/api/v1/theft-reports", json={
        "identifier_value": imei,
        "allegation_category": "lost",
        "description": "duplicate",
    }, headers=headers)
    assert r2.status_code == 200
    assert r2.json()["duplicate"] is True


def test_triage_requires_reviewer():
    import uuid, random
    from app.db.session import SessionLocal
    from app.models.user import User
    email = f"r{uuid.uuid4().hex[:8]}@example.com"
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    # make reviewer
    db = SessionLocal()
    u = db.query(User).filter(User.email == email).first()
    u.role = "reviewer"
    db.commit()
    db.close()
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=headers)
    assert r.status_code == 200
    r = client.post("/api/v1/theft-reports", json={"identifier_value": imei, "allegation_category": "lost", "description": "x"}, headers=headers)
    case_id = r.json()["case_id"]
    # triage unsubstantiated removes restriction
    r = client.post(f"/api/v1/investigations/{case_id}/triage", json={"outcome": "unsubstantiated", "reason": "baseless"}, headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["outcome"] == "unsubstantiated"


def test_identifier_conflict_holds_new_submission():
    import uuid, random
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    # owner
    email1 = f"o{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email1, "password": "Passw0rd!"})
    token1 = r.json()["access_token"]
    h1 = {"Authorization": f"Bearer {token1}"}
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h1)
    assert r.status_code == 200
    # second user submits conflict
    email2 = f"s{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email2, "password": "Passw0rd!"})
    token2 = r.json()["access_token"]
    h2 = {"Authorization": f"Bearer {token2}"}
    r = client.post("/api/v1/identifier-conflicts", json={"identifier_value": imei}, headers=h2)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "open"
