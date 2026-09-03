from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.domain.contact import ContactKind


class ContactRequest(BaseModel):
    """Тело запроса POST /api/v1/contact."""

    contact: str = Field(min_length=1, max_length=254)
    comment: str = Field(default="", max_length=4000)

    @field_validator("contact", "comment")
    @classmethod
    def strip_value(cls, value: str) -> str:
        return value.strip()


class ContactResponse(BaseModel):
    """Ответ на успешно принятую заявку."""

    status: Literal["ok"] = "ok"
    contact_type: ContactKind
    mock_status: bool
