import hashlib
import os
import uuid

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.device import Evidence, EvidenceReview

ALLOWED_EXT = {"pdf", "jpg", "jpeg", "png"}
ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png"}
MAX_BYTES = 10 * 1024 * 1024
STORAGE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "var", "private_evidence"))


def _signature_ok(head: bytes, mime: str) -> bool:
    if mime == "application/pdf":
        return head.startswith(b"%PDF")
    if mime == "image/jpeg":
        return head.startswith(b"\xff\xd8\xff")
    if mime == "image/png":
        return head.startswith(b"\x89PNG\r\n\x1a\n")
    return False


async def upload_evidence(db: Session, user_id: uuid.UUID, claim_id: uuid.UUID | None, case_id: uuid.UUID | None, file: UploadFile) -> Evidence:
    if not file.filename:
        raise HTTPException(status_code=400, detail="missing filename")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="unsupported extension")
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="unsupported mime type")
    # size check while reading
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="empty file")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="file too large")
    if not _signature_ok(data[:8], file.content_type):
        raise HTTPException(status_code=400, detail="signature mismatch")

    os.makedirs(STORAGE_ROOT, exist_ok=True)
    safe_name = f"{uuid.uuid4()}.{ext}"
    rel_key = safe_name
    full_path = os.path.join(STORAGE_ROOT, rel_key)
    with open(full_path, "wb") as f:
        f.write(data)
    checksum = hashlib.sha256(data).hexdigest()

    ev = Evidence(
        claim_id=claim_id,
        case_id=case_id,
        submitted_by=user_id,
        private_storage_key=rel_key,
        mime_type=file.content_type,
        file_size=len(data),
        checksum=checksum,
        review_status="pending",
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def review_evidence(db: Session, reviewer_id: uuid.UUID, evidence_id: uuid.UUID, decision: str, reason: str) -> Evidence:
    if decision not in {"accepted", "rejected", "correction_requested"}:
        raise ValueError("invalid decision")
    ev = db.get(Evidence, evidence_id)
    if ev is None:
        raise ValueError("evidence not found")
    ev.review_status = "accepted" if decision == "accepted" else ("rejected" if decision == "rejected" else "pending")
    record = EvidenceReview(evidence_id=evidence_id, reviewer_id=reviewer_id, decision=decision, reason=reason)
    db.add(record)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev
