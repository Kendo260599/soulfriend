"""Gamification API Routes."""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Any
import sys
from pathlib import Path

# Ensure imports work in production (Render) and development
_current_file = Path(__file__).resolve()
_english_foundation_root = _current_file.parent.parent.parent
_repo_root = _english_foundation_root.parent

# Add both paths to ensure imports work
paths_to_add = [str(_repo_root), str(_english_foundation_root)]
for path in paths_to_add:
    if path not in sys.path:
        sys.path.insert(0, path)

# Try multiple import strategies
try:
    from ..gamification_service import create_gamification_service
except (ImportError, ValueError):
    try:
        from english_foundation.api.gamification_service import create_gamification_service
    except ImportError:
        from api.gamification_service import create_gamification_service

router = APIRouter(prefix="/api/v2/foundation/gamification", tags=["gamification"])

# Request/Response Models
class ActivityRequest(BaseModel):
    userId: int = 1
    activityType: str = "lesson_complete"
    activityData: dict | None = None


class XPRewardRequest(BaseModel):
    userId: int = 1
    xpAmount: int = 0


class ChallengeProgressRequest(BaseModel):
    userId: int = 1
    challengeId: str
    progress: int = 1


class ClaimRewardRequest(BaseModel):
    userId: int = 1
    challengeId: str


def get_service():
    return create_gamification_service()


# ==================== GET Endpoints ====================

@router.get("")
def get_gamification(userId: int = Query(1, alias="userId")) -> dict[str, Any]:
    """Get complete gamification data for a learner."""
    service = get_service()
    result = service.get_gamification_data(learner_id=userId)

    if not result.success:
        raise HTTPException(status_code=500, detail=result.message)

    return {
        "success": True,
        "data": result.data,
    }


@router.get("/achievements")
def get_achievements(userId: int = Query(1, alias="userId")) -> dict[str, Any]:
    """Get all achievements with unlock status."""
    service = get_service()
    result = service.get_achievements(learner_id=userId)

    if not result.success:
        raise HTTPException(status_code=500, detail=result.message)

    return {
        "success": True,
        "data": result.data,
    }


@router.get("/challenges")
def get_challenges(userId: int = Query(1, alias="userId")) -> dict[str, Any]:
    """Get daily challenges with progress."""
    service = get_service()
    result = service.get_challenges(learner_id=userId)

    if not result.success:
        raise HTTPException(status_code=500, detail=result.message)

    return {
        "success": True,
        "data": result.data,
    }


# ==================== POST Endpoints ====================

@router.post("/activity")
def track_activity(request: ActivityRequest) -> dict[str, Any]:
    """Track a learning activity (lesson complete, review complete, etc.)."""
    service = get_service()
    result = service.track_activity(
        learner_id=request.userId,
        activity_type=request.activityType,
        activity_data=request.activityData,
    )

    if not result.success:
        raise HTTPException(status_code=500, detail=result.message)

    return {
        "success": True,
        "data": result.data,
    }


@router.post("/xp")
def award_xp(request: XPRewardRequest) -> dict[str, Any]:
    """Award XP to a learner."""
    service = get_service()
    result = service.award_xp(
        learner_id=request.userId,
        xp_amount=request.xpAmount,
    )

    if not result.success:
        raise HTTPException(status_code=500, detail=result.message)

    return {
        "success": True,
        "data": result.data,
    }


@router.post("/challenge/progress")
def progress_challenge(request: ChallengeProgressRequest) -> dict[str, Any]:
    """Add progress to a daily challenge."""
    service = get_service()
    result = service.progress_challenge(
        learner_id=request.userId,
        challenge_id=request.challengeId,
        progress=request.progress,
    )

    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)

    return {
        "success": True,
        "data": result.data,
    }


@router.post("/challenge/claim")
def claim_reward(request: ClaimRewardRequest) -> dict[str, Any]:
    """Claim reward for a completed challenge."""
    service = get_service()
    result = service.claim_challenge_reward(
        learner_id=request.userId,
        challenge_id=request.challengeId,
    )

    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)

    return {
        "success": True,
        "data": result.data,
    }
