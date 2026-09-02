from fastapi import APIRouter, Depends

from app.api.deps import ContactServiceDep, require_api_key
from app.dto.contact import ContactRequest, ContactResponse
from app.dto.problem import PROBLEM_MEDIA_TYPE, ProblemDetail

router = APIRouter(prefix="/contact", tags=["contact"], dependencies=[Depends(require_api_key)])


@router.post(
    "",
    response_model=ContactResponse,
    responses={
        401: {
            "model": ProblemDetail,
            "description": "API-ключ відсутній або не збігається",
            "content": {PROBLEM_MEDIA_TYPE: {}},
        },
        422: {
            "model": ProblemDetail,
            "description": "Контакт не распознан или тело запроса невалидно",
            "content": {PROBLEM_MEDIA_TYPE: {}},
        }
    },
)
def create_contact(request: ContactRequest, service: ContactServiceDep) -> ContactResponse:
    return service.submit(request)
