from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import Any

from .learning_service import create_learning_service
from .routes.gamification_routes import router as gamification_router

app = FastAPI(title="English Foundation API", version="0.1.0")
service = create_learning_service()

# Include gamification routes
app.include_router(gamification_router)


class VocabCheckRequest(BaseModel):
    learnerId: int
    lessonId: str | None = None
    answers: list[dict[str, Any]]


class GrammarCheckRequest(BaseModel):
    learnerId: int
    lessonId: str | None = None
    grammarId: int
    correct: bool


class ReviewSubmitRequest(BaseModel):
    learnerId: int
    answers: list[dict[str, Any]]


@app.get("/api/foundation/lesson")
def get_lesson(
    track: str | None = Query(None, description="Track type: vocab or grammar"),
    lesson_id: str | None = Query(None, alias="lessonId"),
    learner_id: int = Query(1, alias="learnerId"),
) -> dict[str, Any]:
    if track:
        return service.get_track_lesson_payload(
            track=track,
            lesson_id=lesson_id,
            learner_id=learner_id,
        )
    return service.get_lesson_payload(learner_id=learner_id)


@app.get("/api/foundation/progress")
def get_progress(learner_id: int = Query(1, alias="learnerId")) -> dict[str, Any]:
    return service.get_progress_payload(learner_id=learner_id)


@app.post("/api/foundation/vocab-check")
def submit_vocab_check(request: VocabCheckRequest) -> dict[str, Any]:
    try:
        return service.submit_vocab_check(
            learner_id=request.learnerId,
            lesson_id=request.lessonId,
            answers=request.answers,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/foundation/grammar-check")
def submit_grammar_check(request: GrammarCheckRequest) -> dict[str, Any]:
    try:
        return service.submit_grammar_check(
            learner_id=request.learnerId,
            lesson_id=request.lessonId,
            grammar_id=request.grammarId,
            correct=request.correct,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/foundation/review")
def get_review(
    learner_id: int = Query(1, alias="learnerId"),
    limit: int = Query(20, ge=1, le=50),
) -> dict[str, Any]:
    return service.get_review_payload(learner_id=learner_id, limit=limit)


@app.post("/api/foundation/review-submit")
def submit_review(request: ReviewSubmitRequest) -> dict[str, Any]:
    try:
        return service.submit_review_payload(
            learner_id=request.learnerId,
            answers=request.answers,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/foundation/curriculum")
def get_curriculum() -> dict[str, Any]:
    return service.get_curriculum_payload()
