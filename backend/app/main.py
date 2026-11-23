"""
AIRWISE AI — FastAPI Main Application Entry Point
Initializes the ASGI application, sets up middleware, registers global exception handlers,
and configures the /api/v1 router.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    AirwiseException,
    airwise_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.logging import logger
from app.core.middleware import (
    RequestSizeLimiterMiddleware,
    RequestTracingMiddleware,
    SecurityHeadersMiddleware,
    SimpleRateLimiterMiddleware,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle events: startup and shutdown management."""
    logger.info(
        "Booting %s [v%s] in %s mode",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
    )
    logger.info("Allowed CORS origins: %s", settings.ALLOWED_ORIGINS)
    logger.info(
        "AI Engine configured: %s (Provider: Google Gemini, Model: %s)",
        settings.is_gemini_configured,
        settings.GEMINI_MODEL,
    )
    yield
    logger.info("Shutting down %s cleanly", settings.APP_NAME)


def create_application() -> FastAPI:
    """FastAPI application factory."""
    # Toggle interactive documentation according to configuration
    docs_enabled = settings.ENABLE_DOCS if not settings.is_production else (settings.ENABLE_DOCS and not settings.is_production)
    openapi_url = f"{settings.API_V1_PREFIX}/openapi.json" if settings.ENABLE_DOCS else None
    docs_url = f"{settings.API_V1_PREFIX}/docs" if settings.ENABLE_DOCS else None
    redoc_url = f"{settings.API_V1_PREFIX}/redoc" if settings.ENABLE_DOCS else None

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="GenAI-powered pollution intelligence and assistance platform API",
        openapi_url=openapi_url,
        docs_url=docs_url,
        redoc_url=redoc_url,
        lifespan=lifespan,
    )

    # 1. Security & Observability Middlewares (Applied in reverse order of processing)
    # GZip compression for payloads > 1000 bytes
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Custom security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Correlation ID and latency tracing
    app.add_middleware(RequestTracingMiddleware)

    # Request payload size guard (max 10MB)
    app.add_middleware(RequestSizeLimiterMiddleware)

    # Rate limiting on authentication routes
    app.add_middleware(SimpleRateLimiterMiddleware)

    # 2. Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # 2. Register Centralized Exception Handlers
    app.add_exception_handler(AirwiseException, airwise_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # 3. Include API v1 Router
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    # 4. Root Endpoint
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "online",
            "documentation": f"{settings.API_V1_PREFIX}/docs",
            "health": f"{settings.API_V1_PREFIX}/health",
        }

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.DEBUG,
    )
