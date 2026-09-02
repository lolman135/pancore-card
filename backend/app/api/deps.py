from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.notifications.notifier import ContactNotifier, LoggingContactNotifier
from app.repositories.contact_repository import ContactRepository, JsonlContactRepository
from app.services.contact_service import ContactService

SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_contact_repository(settings: SettingsDep) -> ContactRepository:
    return JsonlContactRepository(settings.storage_path)


def get_contact_notifier() -> ContactNotifier:
    return LoggingContactNotifier()


def get_contact_service(
    repository: Annotated[ContactRepository, Depends(get_contact_repository)],
    notifier: Annotated[ContactNotifier, Depends(get_contact_notifier)],
) -> ContactService:
    return ContactService(repository=repository, notifier=notifier)


ContactServiceDep = Annotated[ContactService, Depends(get_contact_service)]
