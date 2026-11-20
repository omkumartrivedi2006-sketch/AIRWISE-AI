"""
AIRWISE AI — Centralized Exception Handling & Standard Error Models
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logging import logger


class AirwiseException(Exception):
    """Base domain exception for AIRWISE AI applications."""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class DatabaseConnectionException(AirwiseException):
    """Raised when database is unavailable or connection pool exhausted."""
    def __init__(self, message: str = "Database service is currently unreachable", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="DATABASE_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
        )


class AIServiceException(AirwiseException):
    """Raised when upstream AI provider fails or is unconfigured."""
    def __init__(self, message: str = "AI service error", code: str = "AI_SERVICE_ERROR", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details,
        )


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[Any] = None,
) -> JSONResponse:
    """Helper to construct standardized RFC-style error payloads."""
    payload: Dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=payload)


async def airwise_exception_handler(request: Request, exc: AirwiseException) -> JSONResponse:
    """Handles domain-specific AIRWISE exceptions."""
    logger.error("Domain exception [%s]: %s (path: %s)", exc.code, exc.message, request.url.path)
    return create_error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handles Pydantic request validation failures with field-level breakdowns."""
    errors = exc.errors()
    formatted_errors: List[Dict[str, str]] = []
    for err in errors:
        loc = " -> ".join(str(item) for item in err.get("loc", []))
        formatted_errors.append({
            "field": loc,
            "issue": err.get("msg", "Invalid value"),
        })

    logger.warning("Validation failure on %s: %s", request.url.path, formatted_errors)
    return create_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="VALIDATION_ERROR",
        message="Request parameters failed schema validation",
        details=formatted_errors,
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handles standard HTTP exceptions (e.g. 404 Not Found, 405 Method Not Allowed)."""
    code_map = {
        404: "RESOURCE_NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    return create_error_response(
        status_code=exc.status_code,
        code=code,
        message=str(exc.detail),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches all unexpected runtime exceptions and prevents stack trace leakage."""
    logger.exception("Unhandled server exception processing %s: %s", request.url.path, exc)
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred while processing your request",
    )
