import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.core.config import get_settings
from app.notifications.notifier import (
    ContactNotifier,
    LoggingContactNotifier,
    ResendContactNotifier,
    SmtpContactNotifier,
)
from app.repositories.contact_repository import ContactRepository, LoggingContactRepository
from app.services.contact_service import ContactService


def require_api_key(x_api_key: Annotated[str, Header()] = "") -> None:
    """Пускает дальше только запросы с верным заголовком X-API-Key.

    Если API_KEY в .env не задан, проверка отключена (локальная разработка).
    """
    expected = get_settings().api_key
    if not expected:
        return
    if not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def get_contact_repository() -> ContactRepository:
    return LoggingContactRepository()


def get_contact_notifier() -> ContactNotifier:
    """Выбирает способ доставки по MAIL_PROVIDER: smtp (по умолчанию) или resend.

    Без PROD_FLAG или без нужных переменных окружения письма только логируются.
    """
    settings = get_settings()
    if not settings.prod_flag or not (settings.mail_from and settings.mail_to):
        return LoggingContactNotifier()
    if settings.mail_provider == "resend":
        if not settings.resend_api_key:
            return LoggingContactNotifier()
        return ResendContactNotifier(
            api_key=settings.resend_api_key,
            mail_from=settings.mail_from,
            mail_to=settings.mail_to,
            timeout=settings.smtp_timeout,
            api_url=settings.resend_api_url,
        )
    if not settings.mail_from_password:
        return LoggingContactNotifier()
    return SmtpContactNotifier(
        host=settings.smtp_host,
        port=settings.smtp_port,
        mail_from=settings.mail_from,
        mail_from_password=settings.mail_from_password,
        mail_to=settings.mail_to,
        timeout=settings.smtp_timeout,
    )


def get_contact_service(
    repository: Annotated[ContactRepository, Depends(get_contact_repository)],
    notifier: Annotated[ContactNotifier, Depends(get_contact_notifier)],
) -> ContactService:
    return ContactService(repository=repository, notifier=notifier)


ContactServiceDep = Annotated[ContactService, Depends(get_contact_service)]
