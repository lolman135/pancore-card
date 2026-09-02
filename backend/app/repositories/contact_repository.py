import json
from pathlib import Path
from typing import Protocol

from app.domain.contact import ContactSubmission


class ContactRepository(Protocol):
    """Хранилище заявок."""

    def add(self, submission: ContactSubmission) -> None: ...


class JsonlContactRepository:
    """Дописывает заявки в JSONL-файл. Заменяется на БД без правок сервиса."""

    def __init__(self, path: Path) -> None:
        self._path = path

    def add(self, submission: ContactSubmission) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "created_at": submission.created_at.isoformat(),
            "contact": submission.contact.value,
            "contact_type": submission.contact.kind,
            "comment": submission.comment,
        }
        with self._path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
