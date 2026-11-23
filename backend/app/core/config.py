"""
AIRWISE AI — Application Configuration
Managed via Pydantic Settings with strict validation and environment variable overrides.
"""

from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application Information
    APP_NAME: str = "AIRWISE AI Backend"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", description="development, staging, production")
    DEBUG: bool = Field(default=True)
    LOG_LEVEL: str = Field(default="INFO")

    # Network / Host
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"
    ENABLE_DOCS: bool = Field(default=True, description="Enable /docs and /redoc interactive documentation")
    MAX_REQUEST_SIZE_BYTES: int = Field(default=10 * 1024 * 1024, description="Maximum request payload in bytes (10MB)")
    RATE_LIMIT_ENABLED: bool = Field(default=True, description="Enable rate limiting on API endpoints")
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_REQUESTS_PER_MINUTE: int = 15

    # Security & JWT Authentication
    SECRET_KEY: str = Field(
        default="airwise-insecure-dev-secret-key-replace-in-production-32chars",
        description="Cryptographic secret key for signing internal tokens",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_EXPIRE_MINUTES: int = 60
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 24

    # Cookie Settings
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Union[str, None] = None

    # Email Service
    EMAIL_PROVIDER: str = "console"  # console, smtp, mock
    EMAIL_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@airwise.ai"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Database Configuration (MongoDB)
    MONGODB_URI: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI (local or MongoDB Atlas connection string)",
    )
    DB_NAME: str = Field(
        default="airwise_db",
        description="Primary MongoDB database name",
    )
    MONGODB_MAX_POOL_SIZE: int = Field(default=50, description="Max connection pool size")
    MONGODB_MIN_POOL_SIZE: int = Field(default=10, description="Min connection pool size")
    MONGODB_TIMEOUT_MS: int = Field(default=5000, description="Server selection timeout in ms")

    # Legacy compatibility alias
    DATABASE_URL: str = Field(
        default="mongodb://localhost:27017/airwise_db",
        description="Legacy database connection URI alias",
    )

    # Google Gemini AI Integration
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API key (server-side only, never client-exposed)",
    )
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GEMINI_TEMPERATURE: float = 0.4
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048
    GEMINI_TIMEOUT_SECONDS: int = 30

    # AI Configuration & Safeguards
    AI_ENABLED: bool = True
    AI_MAX_INPUT_LENGTH: int = 5000
    AI_MAX_HISTORY_MESSAGES: int = 20
    AI_MAX_DAILY_REQUESTS: int = 50

    # Environmental Data & Live Telemetry (Module 06)
    ENVIRONMENTAL_DATA_ENABLED: bool = True
    PRIMARY_AIR_QUALITY_PROVIDER: str = "open-meteo"
    SECONDARY_AIR_QUALITY_PROVIDER: str = "waqi"
    OPENAQ_API_KEY: str = ""
    WAQI_API_TOKEN: str = ""
    AIR_QUALITY_CACHE_TTL_SECONDS: int = 900
    WEATHER_CACHE_TTL_SECONDS: int = 1800
    ENVIRONMENTAL_API_TIMEOUT_SECONDS: int = 15
    MAX_FRESH_DATA_AGE_MINUTES: int = 120

    # Personalization, Alerts & Notifications (Module 08)
    NOTIFICATIONS_ENABLED: bool = True
    EMAIL_NOTIFICATIONS_ENABLED: bool = False
    WEB_PUSH_ENABLED: bool = False
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_SUBJECT: str = "mailto:notifications@airwise.ai"
    ALERT_EVALUATION_ENABLED: bool = True
    ALERT_DEFAULT_COOLDOWN_MINUTES: int = 60
    RECOMMENDATIONS_ENABLED: bool = True
    RECOMMENDATION_CACHE_TTL_SECONDS: int = 3600

    @property
    def is_gemini_configured(self) -> bool:
        """Verify whether a valid-looking non-placeholder Gemini API key is provided."""
        val = self.GEMINI_API_KEY.strip()
        return bool(val and val != "your_gemini_api_key_here")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
