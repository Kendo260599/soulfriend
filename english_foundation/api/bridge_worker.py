import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from english_foundation.api.learning_service import create_learning_service


def main() -> None:
    service = create_learning_service()

    for raw in sys.stdin:
        line = raw.strip().lstrip("\ufeff")
        if not line:
            continue

        try:
            payload = json.loads(line)
            action = str(payload.get("action", "")).strip().lower()
            learner_id = int(payload.get("learnerId", 1))

            if action == "lesson":
                data = service.get_lesson_payload(learner_id=learner_id)
            elif action == "progress":
                data = service.get_progress_payload()
            else:
                raise ValueError(f"Unsupported action: {action}")

            sys.stdout.write(json.dumps({"ok": True, "data": data}, ensure_ascii=False) + "\n")
            sys.stdout.flush()
        except Exception as exc:  # pragma: no cover
            sys.stdout.write(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
