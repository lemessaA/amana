import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TheftReport(Base):
    __tablename__ = "theft_reports"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    reporter_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    allegation_category: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text)
    incident_period: Mapped[str | None] = mapped_column(String(128), nullable=True)
    screening_status: Mapped[str] = mapped_column(String(16), default="passed")
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("investigation_cases.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class InvestigationCase(Base):
    __tablename__ = "investigation_cases"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    case_status: Mapped[str] = mapped_column(String(16), default="open")
    assigned_reviewer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    deadline_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    extension_deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(32), nullable=True)
    outcome_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accountable_authority_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class IdentifierConflictCase(Base):
    __tablename__ = "identifier_conflict_cases"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_identifier_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("device_identifiers.id"), nullable=True, index=True)
    submitted_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    existing_device_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("devices.id"), nullable=True)
    case_status: Mapped[str] = mapped_column(String(16), default="open")
    assigned_reviewer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    deadline_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    extension_deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(32), nullable=True)
    outcome_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ClaimDisputeCase(Base):
    __tablename__ = "claim_dispute_cases"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    requester_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    case_status: Mapped[str] = mapped_column(String(16), default="open")
    assigned_reviewer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    deadline_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    extension_deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(64), nullable=True)
    outcome_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accountable_authority_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipient_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    channel: Mapped[str] = mapped_column(String(16), default="in_app")
    type: Mapped[str] = mapped_column(String(64))
    delivery_status: Mapped[str] = mapped_column(String(16), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retry_count: Mapped[int] = mapped_column(default=0)
