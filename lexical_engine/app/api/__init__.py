"""Public API service boundary for lexical_engine.

These modules expose JSON-ready payloads for external callers
(future React/backend bridge, legacy UI adapters, scripts).
"""

from app.api import lexical_service, progress_service, recommendation_service

__all__ = [
	"lexical_service",
	"progress_service",
	"recommendation_service",
]
