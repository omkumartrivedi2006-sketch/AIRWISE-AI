"""
AIRWISE AI — Centralized Structured Logging Configuration
"""

import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    """Configure application-wide logger with consistent timestamp and level formatting."""
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Quiet external third-party loggers if needed
    logging.getLogger("uvicorn.access").setLevel(level)
    logging.getLogger("pymongo").setLevel(logging.WARNING)

    logger = logging.getLogger("airwise")
    logger.info("Structured logging initialized at level %s", settings.LOG_LEVEL.upper())
    return logger


logger = setup_logging()
