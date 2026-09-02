import logging
from datetime import datetime, timezone
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.domain.contact import InvalidContactError
from app.dto.problem import PROBLEM_MEDIA_TYPE, ProblemDetail

logger = logging.getLogger(__name__)


def problem_response(
    request: Request,
    *,
    slug: str,
    title: str,
    status: int,
    detail: str,
    **extensions: Any,
) -> JSONResponse:
    problem = ProblemDetail(
        type=f"{get_settings().problem_base_url}/{slug}",
        title=title,
        status=status,
        detail=detail,
        instance=request.url.path,
        timestamp=datetime.now(timezone.utc),
        **extensions,
    )
    return JSONResponse(
        status_code=status,
        content=problem.model_dump(mode="json"),
        media_type=PROBLEM_MEDIA_TYPE,
    )


def _status_title(status: int) -> str:
    try:
        return HTTPStatus(status).phrase
    except ValueError:
        return "Error"


def _slugify(title: str) -> str:
    return title.lower().replace(" ", "-")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(InvalidContactError)
    def handle_invalid_contact(request: Request, exc: InvalidContactError) -> JSONResponse:
        return problem_response(
            request,
            slug="invalid-contact",
            title="Invalid Contact",
            status=422,
            detail=str(exc),
            field="contact",
        )

    @app.exception_handler(RequestValidationError)
    def handle_request_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {
                "field": ".".join(str(part) for part in error["loc"][1:]) or str(error["loc"][0]),
                "message": error["msg"],
                "type": error["type"],
            }
            for error in exc.errors()
        ]
        return problem_response(
            request,
            slug="validation-error",
            title="Validation Error",
            status=422,
            detail="Невірний формат, будь ласка, надайте контакт у форматі номера телефону, нікнейму в Telegram чи email",
            errors=errors,
        )

    @app.exception_handler(StarletteHTTPException)
    def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        title = _status_title(exc.status_code)
        return problem_response(
            request,
            slug=_slugify(title),
            title=title,
            status=exc.status_code,
            detail=str(exc.detail),
        )

    @app.exception_handler(Exception)
    def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "Unhandled error%s", request.url.path, exc_info=exc
        )
        return problem_response(
            request,
            slug="internal-server-error",
            title="Internal Server Error",
            status=500,
            detail="Internal Server Error.",
        )
