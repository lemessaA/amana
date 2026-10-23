from pydantic import BaseModel


class ResolveRequest(BaseModel):
    outcome: str
    reason: str
    next_review_days: int | None = None


class ExtendRequest(BaseModel):
    extension_hours: int
    reason: str
