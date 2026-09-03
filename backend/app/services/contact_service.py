from datetime import datetime, timezone

from app.domain.contact import ContactSubmission
from app.domain.contact_parser import parse_contact
from app.dto.contact import ContactRequest, ContactResponse
from app.notifications.notifier import ContactNotifier
from app.repositories.contact_repository import ContactRepository
from app.core.config import get_settings

class ContactService:
    """Разбирает заявку с формы, сохраняет её и уведомляет о ней."""

    def __init__(self, repository: ContactRepository, notifier: ContactNotifier) -> None:
        self._repository = repository
        self._notifier = notifier

    def submit(self, request: ContactRequest) -> ContactResponse:
        contact = parse_contact(request.contact)

        settings = get_settings()

        submission = ContactSubmission(
            contact=contact,
            comment=request.comment,
            created_at=datetime.now(timezone.utc),
        )

        self._repository.add(submission)
        self._notifier.notify(submission)

        return ContactResponse(contact_type=contact.kind, mock_status=settings.prod_flag)
