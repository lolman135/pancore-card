from typing import Annotated

from fastapi import Depends

from app.core.config import get_settings
from app.notifications.notifier import (
    ContactNotifier,
    LoggingContactNotifier,
    SmtpContactNotifier,
)
from app.repositories.contact_repository import ContactRepository, LoggingContactRepository
from app.services.contact_service import ContactService


def get_contact_repository() -> ContactRepository:
    return LoggingContactRepository()


def get_contact_notifier() -> ContactNotifier:
    settings = get_settings()
    if not (settings.mail_from and settings.mail_from_password and settings.mail_to):
        return LoggingContactNotifier()
    return SmtpContactNotifier(
        host=settings.smtp_host,
        port=settings.smtp_port,
        mail_from=settings.mail_from,
        mail_from_password=settings.mail_from_password,
        mail_to=settings.mail_to,
    )


def get_contact_service(
    repository: Annotated[ContactRepository, Depends(get_contact_repository)],
    notifier: Annotated[ContactNotifier, Depends(get_contact_notifier)],
) -> ContactService:
    return ContactService(repository=repository, notifier=notifier)


ContactServiceDep = Annotated[ContactService, Depends(get_contact_service)]
