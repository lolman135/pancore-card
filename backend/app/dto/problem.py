from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, field_serializer

PROBLEM_MEDIA_TYPE = "application/problem+json"

class ProblemDetail(BaseModel):
    model_config = ConfigDict(extra="allow")

    type: str
    title: str
    status: int
    detail: str
    instance: str
    timestamp: datetime = datetime(1970, 1, 1, tzinfo=timezone.utc)

    @field_serializer("timestamp")
    def serialize_timestamp(self, value: datetime) -> str:
        return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
