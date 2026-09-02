import logging
import smtplib
from email.message import EmailMessage
from typing import Protocol

from app.domain.contact import ContactSubmission

logger = logging.getLogger(__name__)


class ContactNotifier(Protocol):
    def notify(self, submission: ContactSubmission) -> None: ...

class LoggingContactNotifier:

    def notify(self, submission: ContactSubmission) -> None:
        logger.info(
            "Sending message (mock): contact=%s type=%s comment=%r",
            submission.contact.value,
            submission.contact.kind,
            submission.comment,
        )


class SmtpContactNotifier:

    def __init__(
        self,
        host: str,
        port: int,
        mail_from: str,
        mail_from_password: str,
        mail_to: str,
    ) -> None:
        self._host = host
        self._port = port
        self._mail_from = mail_from
        self._mail_from_password = mail_from_password
        self._mail_to = mail_to

    def notify(self, submission: ContactSubmission) -> None:
        message = EmailMessage()
        message["From"] = self._mail_from
        message["To"] = self._mail_to
        message["Subject"] = f"Новая заявка с сайта ({submission.contact.kind})"
        message.set_content(
            f"Контакт: {submission.contact.value}\n"
            f"Тип контакта: {submission.contact.kind}\n"
            f"Дата: {submission.created_at.isoformat()}\n\n"
            f"Комментарий:\n{submission.comment}"
        )

        try:
            with smtplib.SMTP_SSL(self._host, self._port) as smtp:
                smtp.login(self._mail_from, self._mail_from_password)
                smtp.send_message(message)
        except (smtplib.SMTPException, OSError):
            logger.exception(
                "Failed to send contact submission to %s: contact=%s type=%s",
                self._mail_to,
                submission.contact.value,
                submission.contact.kind,
            )
            return

        logger.info("Sent contact submission to %s", self._mail_to)
