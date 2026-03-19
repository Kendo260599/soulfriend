"""English Foundation API - Learning Service."""
import sys
from pathlib import Path

# CRITICAL: Setup sys.path BEFORE any imports
_current_file = Path(__file__).resolve()
_english_foundation_root = _current_file.parent.parent
_repo_root = _english_foundation_root.parent

paths_to_add = [str(_repo_root), str(_english_foundation_root)]
for path in paths_to_add:
    if path not in sys.path:
        sys.path.insert(0, path)

# Import from english_foundation package
from english_foundation.api.learning_service import LearningService, create_learning_service

__all__ = ["LearningService", "create_learning_service"]
