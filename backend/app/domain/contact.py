from dataclasses import dataclass
from datetime import datetime
from typing import Literal

ContactKind = Literal["email", "phone", "telegram"]


class InvalidContactError(ValueError):
    """Контакт не распознан ни как телефон, ни как email, ни как телеграм."""


@dataclass(frozen=True, slots=True)
class Contact:
    """Распознанный и приведённый к каноническому виду контакт."""

    kind: ContactKind
    value: str


@dataclass(frozen=True, slots=True)
class ContactSubmission:
    """Заявка с формы: контакт, комментарий и момент получения."""

    contact: Contact
    comment: str
    created_at: datetime
