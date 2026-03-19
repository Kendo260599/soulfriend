import sys
from pathlib import Path

# Ensure imports work in production (Render) and development
_current_file = Path(__file__).resolve()
_english_foundation_root = _current_file.parent.parent
_repo_root = _english_foundation_root.parent

# Add both paths to ensure imports work
paths_to_add = [str(_repo_root), str(_english_foundation_root)]
for path in paths_to_add:
    if path not in sys.path:
        sys.path.insert(0, path)

# Try multiple import strategies
try:
    from .learning_service import LearningService, create_learning_service
except (ImportError, ValueError):
    try:
        from english_foundation.api.learning_service import LearningService, create_learning_service
    except ImportError:
        from api.learning_service import LearningService, create_learning_service

__all__ = ["LearningService", "create_learning_service"]
