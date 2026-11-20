"""
AIRWISE AI — Alembic Environment Configuration
Loads connection details dynamically from app.core.config.settings and imports all models.
"""

import os
import sys
from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models import (
    Base,
    Conversation,
    Feedback,
    Location,
    Message,
    PollutionObservation,
    TimeStampedModel,
    User,
)

# Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model metadata for autogenerate support
target_metadata = Base.metadata


def get_db_url() -> str:
    """Return database URL from settings, falling back to local SQLite if PostgreSQL is unreachable."""
    url = settings.DATABASE_URL
    if "postgresql" in url:
        try:
            from sqlalchemy import text
            test_engine = create_engine(url, pool_pre_ping=True)
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return url
        except Exception:
            return "sqlite:///./airwise_local.db"
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_db_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode with an active engine connection."""
    url = get_db_url()
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True if "sqlite" in str(url) else False,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
