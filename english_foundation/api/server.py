import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .learning_service import create_learning_service

logger = logging.getLogger(__name__)

app = FastAPI(title="English Foundation API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = create_learning_service()


# ---------------------------------------------------------------------------
# Error handler
# ---------------------------------------------------------------------------
@app.exception_handler(ValueError)
async def value_error_handler(_request: Request, exc: ValueError) -> JSONResponse:
    logger.warning("Validation error: %s", exc)
    return JSONResponse(status_code=422, content={"ok": False, "error": str(exc)})


@app.exception_handler(Exception)
async def generic_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"ok": False, "error": "Internal server error"})


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------
class VocabCheckRequest(BaseModel):
    learnerId: int = 1
    lessonId: str | None = None
    answers: list[dict[str, Any]]


class GrammarCheckRequest(BaseModel):
    learnerId: int = 1
    lessonId: str | None = None
    grammarId: int
    correct: bool


class ReviewSubmitRequest(BaseModel):
    learnerId: int = 1
    answers: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/foundation/lesson")
def get_lesson() -> dict:
    return service.get_lesson_payload()


@app.get("/api/foundation/track-lesson")
def get_track_lesson(track: str = "vocab", lessonId: str | None = None) -> dict:
    return service.get_track_lesson_payload(track=track, lesson_id=lessonId)


@app.get("/api/foundation/curriculum")
def get_curriculum() -> dict:
    return service.get_curriculum_payload()


@app.get("/api/foundation/progress")
def get_progress() -> dict:
    return service.get_progress_payload()


@app.get("/api/foundation/review")
def get_review(learnerId: int = 1, limit: int = 20) -> dict:
    return service.get_review_payload(learner_id=learnerId, limit=limit)


@app.post("/api/foundation/vocab-check")
def submit_vocab_check(body: VocabCheckRequest) -> dict:
    return service.submit_vocab_check(
        learner_id=body.learnerId,
        lesson_id=body.lessonId,
        answers=body.answers,
    )


@app.post("/api/foundation/grammar-check")
def submit_grammar_check(body: GrammarCheckRequest) -> dict:
    return service.submit_grammar_check(
        learner_id=body.learnerId,
        lesson_id=body.lessonId,
        grammar_id=body.grammarId,
        correct=body.correct,
    )


@app.post("/api/foundation/review-submit")
def submit_review(body: ReviewSubmitRequest) -> dict:
    return service.submit_review_payload(
        learner_id=body.learnerId,
        answers=body.answers,
    )
