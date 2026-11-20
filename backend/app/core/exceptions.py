"""
AIRWISE AI — Centralized Exception Handling & Standardized RFC Error Schemas
Ensures all errors return consistent { success: false, message: '...', error: { code, details } } structures.
"""

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
    """Raised when database is unavailable."""
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


class BadRequestException(AirwiseException):
    def __init__(self, message: str = "Bad Request", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="BAD_REQUEST",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class UnauthorizedException(AirwiseException):
    def __init__(self, message: str = "Unauthorized", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
        )


class ForbiddenException(AirwiseException):
    def __init__(self, message: str = "Forbidden", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
        )


class NotFoundException(AirwiseException):
    def __init__(self, message: str = "Resource Not Found", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class ConflictException(AirwiseException):
    def __init__(self, message: str = "Conflict", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[Any] = None,
) -> JSONResponse:
    """Helper to construct standardized error payloads."""
    payload: Dict[str, Any] = {
        "success": False,
        "message": message,
        "error": {
            "code": code,
            "details": details if details is not None else [],
        },
    }
    return JSONResponse(status_code=status_code, content=payload)


async def airwise_exception_handler(request: Request, exc: AirwiseException) -> JSONResponse:
    logger.error("Domain exception [%s]: %s (path: %s)", exc.code, exc.message, request.url.path)
    return create_error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
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
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "RESOURCE_NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    return create_error_response(
        status_code=exc.status_code,
        code=code,
        message=str(exc.detail),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server exception processing %s: %s", request.url.path, exc)
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred while processing your request",
    )
