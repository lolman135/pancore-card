import logging
from typing import Protocol

from app.domain.contact import ContactSubmission

logger = logging.getLogger(__name__)


class ContactNotifier(Protocol):
    """Отправка уведомления о новой заявке."""

    def notify(self, submission: ContactSubmission) -> None: ...


class LoggingContactNotifier:
    """Мок: пишет в лог вместо реальной отправки сообщения."""

    def notify(self, submission: ContactSubmission) -> None:
        logger.info(
            "Отправка сообщения (мок): контакт=%s тип=%s комментарий=%r",
            submission.contact.value,
            submission.contact.kind,
            submission.comment,
        )
