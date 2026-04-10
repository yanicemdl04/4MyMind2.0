from pydantic import BaseModel, Field
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Trend(str, Enum):
    IMPROVING = "improving"
    STABLE = "stable"
    DECLINING = "declining"


class SentimentLabel(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


# ─── Wellbeing ────────────────────────────────────────────


class MoodEntry(BaseModel):
    score: int = Field(..., ge=1, le=10)
    level: str
    date: str


class ActivityEntry(BaseModel):
    category: str
    date: str
    duration_min: int | None = None


class WellbeingRequest(BaseModel):
    moods: list[MoodEntry]
    journal_texts: list[str] = []
    activities: list[ActivityEntry] = []


class WellbeingBreakdown(BaseModel):
    mood_component: float
    stability_component: float
    sentiment_component: float
    activity_component: float


class WellbeingResponse(BaseModel):
    wellbeing_score: float
    risk_level: RiskLevel
    trend: Trend
    breakdown: WellbeingBreakdown
    insights: list[str]


# ─── Sentiment ────────────────────────────────────────────


class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


class SentimentResponse(BaseModel):
    sentiment: SentimentLabel
    score: float = Field(..., ge=-1.0, le=1.0)
    subjectivity: float = Field(..., ge=0.0, le=1.0)


# ─── Health ───────────────────────────────────────────────


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
