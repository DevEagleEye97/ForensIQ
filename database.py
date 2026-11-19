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

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./forensiq_vault.db")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
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
    async with engine.begin() as conn:
        for stmt in SCHEMA_STATEMENTS:
            await conn.execute(text(stmt))
    logger.info("[VAULT] Asynchronous evidence database initialized successfully.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async database session with automatic cleanup.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
