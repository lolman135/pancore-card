from dataclasses import dataclass
from datetime import datetime
from typing import Literal

ContactKind = Literal["email", "phone", "telegram"]


class InvalidContactError(ValueError):
    """Контакт не распознан ни как телефон, ни как email, ни как телеграм."""


@dataclass(frozen=True, slots=True)
class Contact:
    kind: ContactKind
    value: str


@dataclass(frozen=True, slots=True)
class ContactSubmission:
    contact: Contact
    comment: str
    created_at: datetime
