from pydantic import BaseModel


class TriageRequest(BaseModel):
    outcome: str  # substantiated/unsubstantiated/invalid/inconclusive
    reason: str
    next_review_days: int | None = None
