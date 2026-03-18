"""Centralised configuration for the English Foundation module.

All values can be overridden via environment variables.
"""
from __future__ import annotations

import os
from pathlib import Path

_ROOT = Path(__file__).resolve().parent

# --- Database ---
DB_PATH: Path = Path(
    os.getenv("EF_DATABASE_PATH", str(_ROOT / "db" / "english_foundation.db"))
)

# --- Logging ---
LOG_LEVEL: str = os.getenv("EF_LOG_LEVEL", "INFO").upper()

# --- CORS ---
_cors_env = os.getenv("EF_CORS_ORIGINS", "")
CORS_ORIGINS: list[str] = (
    [o.strip() for o in _cors_env.split(",") if o.strip()]
    if _cors_env
    else ["*"]
)

# --- Learner defaults ---
DEFAULT_LEARNER_ID: int = int(os.getenv("EF_DEFAULT_LEARNER_ID", "1"))
