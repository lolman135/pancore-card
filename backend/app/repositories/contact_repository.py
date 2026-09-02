import json
import logging
from pathlib import Path
from typing import Protocol

from app.domain.contact import ContactSubmission

logger = logging.getLogger(__name__)


class ContactRepository(Protocol):
    """Хранилище заявок."""

    def add(self, submission: ContactSubmission) -> None: ...


def serialize(submission: ContactSubmission) -> str:
    record = {
        "created_at": submission.created_at.isoformat(),
        "contact": submission.contact.value,
        "contact_type": submission.contact.kind,
        "comment": submission.comment,
    }
    return json.dumps(record, ensure_ascii=False)


class LoggingContactRepository:
    """Пишет заявки в лог, а не в файл. Поток выбирает logging — по умолчанию stderr."""

    def add(self, submission: ContactSubmission) -> None:
        logger.info("Contact submission: %s", serialize(submission))


class JsonlContactRepository:
    """Дописывает заявки в JSONL-файл. Заменяется на БД без правок сервиса."""

    def __init__(self, path: Path) -> None:
        self._path = path

    def add(self, submission: ContactSubmission) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with self._path.open("a", encoding="utf-8") as fh:
            fh.write(serialize(submission) + "\n")
