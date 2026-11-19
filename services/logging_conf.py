"""
ForensIQ Structured JSON Logging Configuration
Sentry-ready, high-throughput, machine-parseable JSON logging for production forensics.
"""

import logging
import json
import time
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    """
    Format log records as structured single-line JSON strings.
    Extracts custom record attributes from the 'ctx' extra dictionary.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }

        ctx = getattr(record, "ctx", None)
        if isinstance(ctx, dict):
            log_entry.update(ctx)

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str)


def configure_logging(level: int = logging.INFO) -> None:
    """Configure the root 'forensiq' logger with the JSON formatter."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())

    forensiq_logger = logging.getLogger("forensiq")
    forensiq_logger.handlers = [handler]
    forensiq_logger.setLevel(level)
    forensiq_logger.propagate = False
