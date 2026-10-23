from pydantic import BaseModel


class ClaimDisputeRequest(BaseModel):
    identifier_value: str
    acquisition_basis: str = "other/unverified"
    description: str
