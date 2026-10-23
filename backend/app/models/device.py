import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, ForeignKey, UniqueConstraint, Index
from sqlalchemy import UUID as SAUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Device(Base):
    __tablename__ = "devices"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_type: Mapped[str] = mapped_column(String(16))  # phone/computer
    record_status: Mapped[str] = mapped_column(String(16), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class DeviceIdentifier(Base):
    __tablename__ = "device_identifiers"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    identifier_type: Mapped[str] = mapped_column(String(16))  # imei/serial
    normalized_value: Mapped[str] = mapped_column(String(128), index=True)
    review_status: Mapped[str] = mapped_column(String(16), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DeviceClaim(Base):
    __tablename__ = "device_claims"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    claimant_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    receipt_status: Mapped[str] = mapped_column(String(16), default="receipt-free")
    acquisition_basis: Mapped[str] = mapped_column(String(64), default="other/unverified")
    claim_status: Mapped[str] = mapped_column(String(16), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DeviceAssociation(Base):
    __tablename__ = "device_associations"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    claim_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("device_claims.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    association_status: Mapped[str] = mapped_column(String(16), default="active")
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_reason: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Restriction(Base):
    __tablename__ = "restrictions"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    restriction_type: Mapped[str] = mapped_column(String(32))
    source_case_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source_case_id: Mapped[uuid.UUID | None] = mapped_column(SAUUID(as_uuid=True), nullable=True)
    reason: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(16), default="active")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accountable_authority_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)



# Transfer model placed here to avoid new file imports complexity
from sqlalchemy import DateTime as _DT, ForeignKey as _FK, String as _S
import uuid as _uuid
from datetime import datetime as _datetime, timezone as _tz

class Transfer(Base):
    __tablename__ = "transfers"
    id: Mapped[_uuid.UUID] = mapped_column(primary_key=True, default=_uuid.uuid4)
    device_id: Mapped[_uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    source_claim_id: Mapped[_uuid.UUID] = mapped_column(ForeignKey("device_claims.id", ondelete="CASCADE"), index=True)
    recipient_user_id: Mapped[_uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")
    acquisition_basis: Mapped[str] = mapped_column(String(64), default="Acquired via AMANA-approved transfer")
    initiated_at: Mapped[_datetime] = mapped_column(DateTime(timezone=True), default=lambda: _datetime.now(_tz.utc))
    expires_at: Mapped[_datetime] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[_datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[_datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[_datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Evidence(Base):
    __tablename__ = "evidence"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    claim_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("device_claims.id", ondelete="SET NULL"), nullable=True, index=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("investigation_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    submitted_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    private_storage_key: Mapped[str] = mapped_column(String(256))
    mime_type: Mapped[str] = mapped_column(String(64))
    file_size: Mapped[int] = mapped_column()
    checksum: Mapped[str] = mapped_column(String(128))
    review_status: Mapped[str] = mapped_column(String(16), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class EvidenceReview(Base):
    __tablename__ = "evidence_reviews"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    evidence_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("evidence.id", ondelete="CASCADE"), index=True)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    decision: Mapped[str] = mapped_column(String(32))
    reason: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
