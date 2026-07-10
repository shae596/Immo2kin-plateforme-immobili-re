from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import verify_api_key
from app.services.recommendation_engine import rank_for_user, rank_similar

router = APIRouter(prefix="/api/v1", tags=["recommendations"])


class RankRequest(BaseModel):
    signals: list[dict[str, Any]] = Field(default_factory=list)
    candidates: list[dict[str, Any]] = Field(default_factory=list)
    limit: int = Field(default=12, ge=1, le=50)


class SimilarRankRequest(BaseModel):
    source: dict[str, Any]
    candidates: list[dict[str, Any]] = Field(default_factory=list)
    limit: int = Field(default=6, ge=1, le=24)


@router.post("/recommendations/rank", dependencies=[Depends(verify_api_key)])
def rank_recommendations(payload: RankRequest) -> dict:
    data = rank_for_user(payload.signals, payload.candidates, payload.limit)
    return {"data": data}


@router.post("/similar/rank", dependencies=[Depends(verify_api_key)])
def rank_similar_properties(payload: SimilarRankRequest) -> dict:
    data = rank_similar(payload.source, payload.candidates, payload.limit)
    return {"data": data}


@router.get("/recommendations")
def legacy_recommendations() -> dict:
    return {
        "message": "Utilisez POST /api/v1/recommendations/rank via l'API Laravel.",
    }
