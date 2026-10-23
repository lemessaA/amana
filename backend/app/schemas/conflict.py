from pydantic import BaseModel


class IdentifierConflictRequest(BaseModel):
    identifier_value: str
