# AMANA — Secure Device Registration and Second-Hand Transaction Safety Platform

Implementation in progress. Mandated stack for this repository: Next.js + TypeScript (frontend), FastAPI + PostgreSQL (backend).

## Current State Audit

- Repository was empty (no commits) at start.
- SRS v4.0 located and extracted to `srs.txt` (source PDF: `AMANA_SRS_v4.0_Consolidated.pdf`).
- SRS implementation-stack note says PERN; this build follows the requested Next.js + FastAPI mandate. See unresolved decision below.

## Implemented (increment 1)

- Backend FastAPI skeleton with health endpoint.
- PostgreSQL schema (Alembic): users, devices, identifiers, claims, associations, restrictions, audit events.
- Partial unique index for one active association per device.
- JWT authentication: register/login/me.
- IMEI syntax + Luhn validation.
- Device registration with claim + association + audit event.
- Public device lookup returning generic effective status only.
- Tests: health, auth, device registration, lookup, invalid IMEI.

## Next Priority

- Frontend (Next.js) auth/device/lookup flows.
- Theft reports and investigations with deadlines/escalation.
- Identifier conflict, claim dispute, transfers.
- Evidence upload privacy and rate limiting.

## Backend Setup

```bash
cd backend
export DATABASE_URL="postgresql+psycopg2://USER:PASS@HOST/DB"
export SECRET_KEY="change-me"
python -m uvicorn app.main:app --reload
# migrations
alembic upgrade head
# tests
pytest -q
```

## Unresolved Decision

- Retention periods, designated case authority, and inconclusive-restriction policy require supervisor approval (SRS §18).
- SRS stack (PERN) conflicts with mandated stack (Next.js/FastAPI); proceeding with mandated stack.
