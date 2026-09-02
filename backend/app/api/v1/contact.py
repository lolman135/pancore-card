from fastapi import APIRouter

from app.api.deps import ContactServiceDep
from app.dto.contact import ContactRequest, ContactResponse

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactResponse)
def create_contact(request: ContactRequest, service: ContactServiceDep) -> ContactResponse:
    return service.submit(request)
