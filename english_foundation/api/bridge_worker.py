import json
import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)

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
            logger.debug("Bridge action=%s", action)
            learner_id = int(payload.get("learnerId") or payload.get("learner_id") or 1)
            track = str(payload.get("track", "vocab") or "vocab")
            lesson_id = payload.get("lessonId")
            grammar_id = payload.get("grammarId")
            correct = payload.get("correct")
            answers = payload.get("answers", [])

            if action == "lesson":
                data = service.get_lesson_payload(learner_id=learner_id)
            elif action == "track_lesson":
                data = service.get_track_lesson_payload(
                    track=track,
                    lesson_id=str(lesson_id) if lesson_id else None,
                    learner_id=learner_id,
                )
            elif action == "curriculum":
                data = service.get_curriculum_payload()
            elif action == "progress":
                data = service.get_progress_payload(learner_id=learner_id)
            elif action == "vocab_check":
                data = service.submit_vocab_check(
                    learner_id=learner_id,
                    lesson_id=str(lesson_id) if lesson_id else None,
                    answers=answers,
                )
            elif action == "grammar_check":
                data = service.submit_grammar_check(
                    learner_id=learner_id,
                    lesson_id=str(lesson_id) if lesson_id else None,
                    grammar_id=int(grammar_id),
                    correct=bool(correct),
                )
            elif action == "review":
                limit = int(payload.get("limit") or 20)
                data = service.get_review_payload(learner_id=learner_id, limit=limit)
            elif action == "review_submit":
                data = service.submit_review_payload(learner_id=learner_id, answers=answers)
            else:
                raise ValueError(f"Unsupported action: {action}")

            sys.stdout.write(json.dumps({"ok": True, "data": data}, ensure_ascii=False) + "\n")
            sys.stdout.flush()
        except Exception as exc:  # pragma: no cover
            logger.error("Bridge error for action=%s: %s", action if 'action' in dir() else '?', exc, exc_info=True)
            sys.stdout.write(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
