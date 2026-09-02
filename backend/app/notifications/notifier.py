import logging
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
