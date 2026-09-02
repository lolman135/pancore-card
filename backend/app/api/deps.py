from typing import Annotated

from fastapi import Depends

from app.notifications.notifier import ContactNotifier, LoggingContactNotifier
from app.repositories.contact_repository import ContactRepository, LoggingContactRepository
from app.services.contact_service import ContactService


def get_contact_repository() -> ContactRepository:
    return LoggingContactRepository()


def get_contact_notifier() -> ContactNotifier:
    return LoggingContactNotifier()


def get_contact_service(
    repository: Annotated[ContactRepository, Depends(get_contact_repository)],
    notifier: Annotated[ContactNotifier, Depends(get_contact_notifier)],
) -> ContactService:
    return ContactService(repository=repository, notifier=notifier)


ContactServiceDep = Annotated[ContactService, Depends(get_contact_service)]
