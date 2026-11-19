"""
ForensIQ Database Engine
Provider: SQLite (aiosqlite for asynchronous operational compliance)
Architecture: Palantir Gotham / Cisco Secure Endpoint Minimalist Data Layer
"""

import os
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text

logger = logging.getLogger("forensiq.database")

is_vercel = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
default_sqlite_path = "/tmp/forensiq_vault.db" if is_vercel else "./forensiq_vault.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{default_sqlite_path}")

# Normalize PostgreSQL URLs for SQLAlchemy asyncpg driver if provided by Supabase
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

is_sqlite = "sqlite" in DATABASE_URL

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if is_sqlite else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS evidence_vault (
        case_id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        file_hash TEXT NOT NULL UNIQUE,
        file_size_bytes INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        tamper_probability INTEGER NOT NULL,
        verdict TEXT NOT NULL,
        classification_model TEXT NOT NULL,
        exif_software TEXT,
        camera_make TEXT,
        anomalies_json TEXT NOT NULL,
        ela_base64_preview TEXT,
        timestamp_utc DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """
]


async def init_db() -> None:
    """
    Initialize SQLite evidence vault table according to exact specification.
    """
    try:
        async with engine.begin() as conn:
            for stmt in SCHEMA_STATEMENTS:
                await conn.execute(text(stmt))
        logger.info("[VAULT] Asynchronous evidence database initialized successfully.")
    except Exception as exc:
        logger.warning("[VAULT] Database initialization deferred or read-only: %s", exc)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async database session with automatic cleanup.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
