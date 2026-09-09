import json
import logging
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage
from typing import Protocol

from app.domain.contact import ContactSubmission
from app.core import config

logger = logging.getLogger(__name__)


class ContactNotifier(Protocol):
    def notify(self, submission: ContactSubmission) -> None: ...


def build_subject(submission: ContactSubmission) -> str:
    return f"Новая заявка с сайта ({submission.contact.kind})"


def build_body(submission: ContactSubmission) -> str:
    return (
        f"Контакт: {submission.contact.value}\n"
        f"Тип контакта: {submission.contact.kind}\n"
        f"Дата: {submission.created_at.isoformat()}\n\n"
        f"Комментарий:\n{submission.comment}"
    )

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
        timeout: float = config.DEFAULT_SMTP_TIMEOUT,
    ) -> None:
        self._host = host
        self._port = port
        self._timeout = timeout
        self._mail_from = mail_from
        self._mail_from_password = mail_from_password
        self._mail_to = mail_to

    def notify(self, submission: ContactSubmission) -> None:
        message = EmailMessage()
        message["From"] = self._mail_from
        message["To"] = self._mail_to
        message["Subject"] = build_subject(submission)
        message.set_content(build_body(submission))

        try:
            with smtplib.SMTP_SSL(self._host, self._port, timeout=self._timeout) as smtp:
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


class ResendContactNotifier:
    """Отправляет письмо через HTTP API Resend (порт 443).

    Нужен, когда хостер режет исходящий SMTP (DigitalOcean и т.п.).
    """

    def __init__(
        self,
        api_key: str,
        mail_from: str,
        mail_to: str,
        timeout: float = config.DEFAULT_SMTP_TIMEOUT,
        api_url: str = config.DEFAULT_RESEND_API_URL,
    ) -> None:
        self._api_key = api_key
        self._mail_from = mail_from
        self._mail_to = mail_to
        self._timeout = timeout
        self._api_url = api_url

    def notify(self, submission: ContactSubmission) -> None:
        payload = json.dumps(
            {
                "from": self._mail_from,
                "to": [self._mail_to],
                "subject": build_subject(submission),
                "text": build_body(submission),
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            self._api_url,
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
                # Cloudflare перед Resend блокирует дефолтный Python-urllib/x.y (код 1010).
                "User-Agent": f"{config.get_settings().app_name}/{config.get_settings().version}",
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:
                response.read()
        except urllib.error.HTTPError as exc:
            logger.error(
                "Failed to send contact submission to %s via Resend: status=%s body=%s contact=%s type=%s",
                self._mail_to,
                exc.code,
                exc.read().decode("utf-8", errors="replace"),
                submission.contact.value,
                submission.contact.kind,
            )
            return
        except OSError:
            logger.exception(
                "Failed to send contact submission to %s via Resend: contact=%s type=%s",
                self._mail_to,
                submission.contact.value,
                submission.contact.kind,
            )
            return

        logger.info("Sent contact submission to %s via Resend", self._mail_to)
