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
        "identifier_value": "not-a-valid-imei",
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
    owner_email = f"o{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": owner_email, "password": "Passw0rd!"})
    owner_token = r.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=owner_headers)
    assert r.status_code == 200
    r = client.post("/api/v1/theft-reports", json={"identifier_value": imei, "allegation_category": "lost", "description": "x"}, headers=owner_headers)
    case_id = r.json()["case_id"]

    rev_email = f"rev{uuid.uuid4().hex[:6]}@example.com"
    rr = client.post("/api/v1/auth/register", json={"email": rev_email, "password": "Passw0rd!"})
    db = SessionLocal()
    u = db.query(User).filter(User.email == rev_email).first()
    u.role = "reviewer"
    db.commit()
    db.close()
    rh = {"Authorization": f"Bearer {rr.json()['access_token']}"}
    r = client.post(f"/api/v1/investigations/{case_id}/triage", json={"outcome": "unsubstantiated", "reason": "baseless"}, headers=rh)
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


def test_claim_dispute_and_voluntary_release():
    import uuid, random
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    # owner
    email1 = f"o{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email1, "password": "Passw0rd!"})
    t1 = r.json()["access_token"]
    h1 = {"Authorization": f"Bearer {t1}"}
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h1)
    assert r.status_code == 200
    # competing claimant
    email2 = f"c{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email2, "password": "Passw0rd!"})
    t2 = r.json()["access_token"]
    h2 = {"Authorization": f"Bearer {t2}"}
    r = client.post("/api/v1/claim-disputes", json={"identifier_value": imei, "acquisition_basis": "other/unverified", "description": "competing claim"}, headers=h2)
    assert r.status_code == 200, r.text
    case_id = r.json()["case_id"]
    # voluntary release by owner
    r = client.post(f"/api/v1/claim-disputes/{case_id}/release", headers=h1)
    assert r.status_code == 200, r.text
    assert r.json()["outcome"] == "released_by_claimant"


def test_transfer_complete_and_resale_eligible():
    import uuid, random
    from app.db.session import SessionLocal
    from app.models.device import DeviceClaim, DeviceAssociation
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    # owner
    email1 = f"o{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email1, "password": "Passw0rd!"})
    t1 = r.json()["access_token"]; h1 = {"Authorization": f"Bearer {t1}"}
    # recipient
    email2 = f"r{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email2, "password": "Passw0rd!"})
    t2 = r.json()["access_token"]; h2 = {"Authorization": f"Bearer {t2}"}
    recipient_id = client.get("/api/v1/auth/me", headers=h2).json()["id"]

    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h1)
    assert r.status_code == 200
    device_id = r.json()["device_id"]

    # mark eligible basis
    db = SessionLocal()
    claim = db.query(DeviceClaim).filter(DeviceClaim.device_id == device_id).first()
    claim.acquisition_basis = "accepted receipt-backed claim"
    db.commit()
    db.close()

    r = client.post("/api/v1/transfers/initiate", json={"device_id": device_id, "recipient_user_id": recipient_id}, headers=h1)
    assert r.status_code == 200, r.text
    tid = r.json()["transfer_id"]
    # recipient accepts
    r = client.post(f"/api/v1/transfers/{tid}/accept", headers=h2)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "completed"

    # recipient acquired basis eligible -> can initiate another transfer to a third user
    email3 = f"r2{uuid.uuid4().hex[:6]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email3, "password": "Passw0rd!"})
    t3 = r.json()["access_token"]; h3 = {"Authorization": f"Bearer {t3}"}
    third_id = client.get("/api/v1/auth/me", headers=h3).json()["id"]
    r = client.post("/api/v1/transfers/initiate", json={"device_id": device_id, "recipient_user_id": third_id}, headers=h2)
    assert r.status_code == 200, r.text


def test_evidence_upload_and_review():
    import uuid, io
    from app.db.session import SessionLocal
    from app.models.user import User
    email = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    token = r.json()["access_token"]; h = {"Authorization": f"Bearer {token}"}

    # valid PDF upload
    pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\n"
    files = {"file": ("receipt.pdf", io.BytesIO(pdf), "application/pdf")}
    r = client.post("/api/v1/evidence/upload", files=files, headers=h)
    assert r.status_code == 200, r.text
    eid = r.json()["evidence_id"]
    assert r.json()["review_status"] == "pending"

    # unsupported extension
    files = {"file": ("bad.exe", io.BytesIO(b"MZ"), "application/octet-stream")}
    r = client.post("/api/v1/evidence/upload", files=files, headers=h)
    assert r.status_code == 400

    # make reviewer and accept
    r2_email = f"rev{uuid.uuid4().hex[:6]}@example.com"
    rr = client.post("/api/v1/auth/register", json={"email": r2_email, "password": "Passw0rd!"})
    db = SessionLocal()
    u = db.query(User).filter(User.email == r2_email).first()
    u.role = "reviewer"
    db.commit(); db.close()
    rh = {"Authorization": f"Bearer {rr.json()['access_token']}"}
    r = client.post(f"/api/v1/evidence/{eid}/review", data={"decision": "accepted", "reason": "ok"}, headers=rh)
    assert r.status_code == 200, r.text
    assert r.json()["review_status"] == "accepted"


def test_account_deactivation_allowed_and_blocked():
    import uuid, random
    from app.db.session import SessionLocal
    from app.models.device import DeviceClaim

    # Blocked by pending transfer
    email1 = f"o{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email1, "password": "Passw0rd!"})
    t1 = r.json()["access_token"]; h1 = {"Authorization": f"Bearer {t1}"}
    email2 = f"r{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email2, "password": "Passw0rd!"})
    recipient_id = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {r.json()['access_token']}"}).json()["id"]
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h1)
    device_id = r.json()["device_id"]
    db = SessionLocal()
    claim = db.query(DeviceClaim).filter(DeviceClaim.device_id == device_id).first()
    claim.acquisition_basis = "accepted receipt-backed claim"
    db.commit(); db.close()
    r = client.post("/api/v1/transfers/initiate", json={"device_id": device_id, "recipient_user_id": recipient_id}, headers=h1)
    assert r.status_code == 200
    r = client.post("/api/v1/account/deactivate", headers=h1)
    assert r.status_code == 400, r.text

    # Allowed when no holds
    email3 = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email3, "password": "Passw0rd!"})
    h3 = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = client.post("/api/v1/account/deactivate", headers=h3)
    assert r.status_code == 200, r.text
    assert r.json()["account_status"] == "deactivated"


def test_notifications_created():
    import uuid, random
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    email = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    token = r.json()["access_token"]; h = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h)
    assert r.status_code == 200
    r = client.post("/api/v1/theft-reports", json={"identifier_value": imei, "allegation_category": "lost", "description": "x"}, headers=h)
    assert r.status_code == 200
    r = client.get("/api/v1/notifications", headers=h)
    assert r.status_code == 200
    types = [n["type"] for n in r.json()]
    assert "theft_report_received" in types


def test_transfer_expiry_processing():
    import uuid, random
    from app.db.session import SessionLocal
    from app.models.device import DeviceClaim, Transfer
    from app.models.user import User

    email1 = f"o{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email1, "password": "Passw0rd!"})
    t1 = r.json()["access_token"]; h1 = {"Authorization": f"Bearer {t1}"}
    email2 = f"r{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email2, "password": "Passw0rd!"})
    recipient_id = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {r.json()['access_token']}"}).json()["id"]

    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h1)
    device_id = r.json()["device_id"]
    db = SessionLocal()
    claim = db.query(DeviceClaim).filter(DeviceClaim.device_id == device_id).first()
    claim.acquisition_basis = "accepted receipt-backed claim"
    db.commit(); db.close()

    r = client.post("/api/v1/transfers/initiate", json={"device_id": device_id, "recipient_user_id": recipient_id}, headers=h1)
    assert r.status_code == 200
    tid = r.json()["transfer_id"]

    # expire manually
    db = SessionLocal()
    tr = db.get(Transfer, uuid.UUID(tid))
    from datetime import datetime, timedelta, timezone
    tr.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    db.commit()
    # reviewer
    rev_email = f"rev{uuid.uuid4().hex[:6]}@example.com"
    rr = client.post("/api/v1/auth/register", json={"email": rev_email, "password": "Passw0rd!"})
    dbu = SessionLocal()
    u = dbu.query(User).filter(User.email == rev_email).first()
    u.role = "reviewer"
    dbu.commit(); dbu.close()
    rh = {"Authorization": f"Bearer {rr.json()['access_token']}"}
    r = client.post("/api/v1/transfers/expire-overdue", headers=rh)
    assert r.status_code == 200, r.text
    db = SessionLocal()
    tr = db.get(Transfer, uuid.UUID(tid))
    assert tr.status == "expired"
    db.close()


def test_identifier_conflict_resolve_extend():
    import uuid, random
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    # owner
    email1 = f"o{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email1, "password": "Passw0rd!"})
    t1 = r.json()["access_token"]; h1 = {"Authorization": f"Bearer {t1}"}
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h1)
    assert r.status_code == 200
    # second user creates conflict
    email2 = f"s{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email2, "password": "Passw0rd!"})
    t2 = r.json()["access_token"]; h2 = {"Authorization": f"Bearer {t2}"}
    r = client.post("/api/v1/identifier-conflicts", json={"identifier_value": imei}, headers=h2)
    assert r.status_code == 200
    case_id = r.json()["case_id"]
    # make current user senior reviewer by updating email2? Need reviewer; use existing r? Instead create reviewer account
    rev_email = f"rev{uuid.uuid4().hex[:6]}@example.com"
    rr = client.post("/api/v1/auth/register", json={"email": rev_email, "password": "Passw0rd!"})
    from app.db.session import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    u = db.query(User).filter(User.email == rev_email).first()
    u.role = "senior_reviewer"
    db.commit(); db.close()
    rh = {"Authorization": f"Bearer {rr.json()['access_token']}"}
    # extend
    r = client.post(f"/api/v1/identifier-conflicts/{case_id}/extend", json={"extension_hours": 24, "reason": "need more time"}, headers=rh)
    assert r.status_code == 200, r.text
    # resolve as reviewer-level; make reviewer too (same senior ok)
    r = client.post(f"/api/v1/identifier-conflicts/{case_id}/resolve", json={"outcome": "duplicate", "reason": "same id"}, headers=rh)
    assert r.status_code == 200, r.text
    assert r.json()["outcome"] == "duplicate"


def test_reconsideration_workflow():
    import uuid, random
    from app.db.session import SessionLocal
    from app.models.user import User

    email = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    token = r.json()["access_token"]; h = {"Authorization": f"Bearer {token}"}
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h)
    assert r.status_code == 200
    r = client.post("/api/v1/theft-reports", json={"identifier_value": imei, "allegation_category": "lost", "description": "x"}, headers=h)
    case_id = r.json()["case_id"]

    # reviewer triages unsubstantiated to close case
    rev_email = f"rev{uuid.uuid4().hex[:6]}@example.com"
    rr = client.post("/api/v1/auth/register", json={"email": rev_email, "password": "Passw0rd!"})
    db = SessionLocal()
    u = db.query(User).filter(User.email == rev_email).first()
    u.role = "reviewer"
    db.commit(); db.close()
    rh = {"Authorization": f"Bearer {rr.json()['access_token']}"}
    r = client.post(f"/api/v1/investigations/{case_id}/triage", json={"outcome": "unsubstantiated", "reason": "baseless"}, headers=rh)
    assert r.status_code == 200

    # requester submits reconsideration
    r = client.post("/api/v1/reconsiderations", json={"case_type": "investigation", "case_id": case_id, "reason": "new info"}, headers=h)
    assert r.status_code == 200, r.text
    rid = r.json()["request_id"]

    # senior reviewer decides
    sr_email = f"sr{uuid.uuid4().hex[:6]}@example.com"
    sr = client.post("/api/v1/auth/register", json={"email": sr_email, "password": "Passw0rd!"})
    db = SessionLocal()
    u = db.query(User).filter(User.email == sr_email).first()
    u.role = "senior_reviewer"
    db.commit(); db.close()
    srh = {"Authorization": f"Bearer {sr.json()['access_token']}"}
    r = client.post(f"/api/v1/reconsiderations/{rid}/decide", json={"outcome": "rejected", "reason": "insufficient"}, headers=srh)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "decided"


def test_limited_case_access_for_deactivated():
    import uuid
    email = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    token = r.json()["access_token"]; h = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/v1/account/deactivate", headers=h)
    assert r.status_code == 200
    r = client.get("/api/v1/account/limited-case-access", headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["account_status"] == "deactivated"


def test_reopen_closed_investigation():
    import uuid, random
    from app.db.session import SessionLocal
    from app.models.user import User

    email = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    token = r.json()["access_token"]; h = {"Authorization": f"Bearer {token}"}
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h)
    assert r.status_code == 200
    r = client.post("/api/v1/theft-reports", json={"identifier_value": imei, "allegation_category": "lost", "description": "x"}, headers=h)
    case_id = r.json()["case_id"]

    rev_email = f"rev{uuid.uuid4().hex[:6]}@example.com"
    rr = client.post("/api/v1/auth/register", json={"email": rev_email, "password": "Passw0rd!"})
    db = SessionLocal()
    u = db.query(User).filter(User.email == rev_email).first()
    u.role = "reviewer"
    db.commit(); db.close()
    rh = {"Authorization": f"Bearer {rr.json()['access_token']}"}
    r = client.post(f"/api/v1/investigations/{case_id}/triage", json={"outcome": "unsubstantiated", "reason": "baseless"}, headers=rh)
    assert r.status_code == 200

    sr_email = f"sr{uuid.uuid4().hex[:6]}@example.com"
    sr = client.post("/api/v1/auth/register", json={"email": sr_email, "password": "Passw0rd!"})
    db = SessionLocal()
    u = db.query(User).filter(User.email == sr_email).first()
    u.role = "senior_reviewer"
    db.commit(); db.close()
    srh = {"Authorization": f"Bearer {sr.json()['access_token']}"}
    r = client.post(f"/api/v1/investigations/{case_id}/reopen", json={"reason": "new evidence", "apply_provisional_restriction": True}, headers=srh)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "open"


def test_process_investigation_deadlines():
    import uuid
    rev_email = f"sr{uuid.uuid4().hex[:6]}@example.com"
    rr = client.post("/api/v1/auth/register", json={"email": rev_email, "password": "Passw0rd!"})
    from app.db.session import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    u = db.query(User).filter(User.email == rev_email).first()
    u.role = "senior_reviewer"
    db.commit(); db.close()
    h = {"Authorization": f"Bearer {rr.json()['access_token']}"}
    r = client.post("/api/v1/investigations/process-deadlines", headers=h)
    assert r.status_code == 200, r.text
    assert "warnings_sent" in r.json()


def test_association_release():
    import uuid, random
    imei = make_imei("".join(str(random.randrange(10)) for _ in range(14)))
    email = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!"})
    token = r.json()["access_token"]; h = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/v1/devices/register", json={"device_type": "phone", "identifier_type": "imei", "identifier_value": imei}, headers=h)
    assert r.status_code == 200
    device_id = r.json()["device_id"]
    r = client.post(f"/api/v1/devices/{device_id}/release", headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "ended"
