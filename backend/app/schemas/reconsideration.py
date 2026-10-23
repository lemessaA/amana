from pydantic import BaseModel


class ReconsiderationRequestSchema(BaseModel):
    case_type: str
    case_id: str
    reason: str


class ReconsiderationDecisionSchema(BaseModel):
    outcome: str
    reason: str
