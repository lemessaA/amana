from pydantic import BaseModel


class TheftReportRequest(BaseModel):
    identifier_value: str
    allegation_category: str
    description: str
    incident_period: str | None = None
