import numpy as np
from models.schemas import (
    WellbeingRequest,
    WellbeingResponse,
    WellbeingBreakdown,
    RiskLevel,
    Trend,
)
from services.sentiment_service import analyze_sentiment


def predict_wellbeing(data: WellbeingRequest) -> WellbeingResponse:
    """
    Composite wellbeing prediction combining:
      1. Mood average & stability (weighted)
      2. Journal sentiment analysis
      3. Activity frequency

    Algorithm is explainable and deterministic — suitable for academic evaluation.
    """
    mood_component = _compute_mood_component(data.moods)
    stability_component = _compute_stability_component(data.moods)
    sentiment_component = _compute_sentiment_component(data.journal_texts)
    activity_component = _compute_activity_component(data.activities)

    # Weighted composite: mood 35%, stability 15%, sentiment 25%, activity 25%
    score = (
        mood_component * 0.35
        + stability_component * 0.15
        + sentiment_component * 0.25
        + activity_component * 0.25
    )
    score = round(min(100.0, max(0.0, score)), 2)

    risk_level = _assess_risk(score, data.moods)
    trend = _detect_trend(data.moods)
    insights = _generate_insights(
        score, mood_component, sentiment_component, activity_component, trend
    )

    return WellbeingResponse(
        wellbeing_score=score,
        risk_level=risk_level,
        trend=trend,
        breakdown=WellbeingBreakdown(
            mood_component=round(mood_component, 2),
            stability_component=round(stability_component, 2),
            sentiment_component=round(sentiment_component, 2),
            activity_component=round(activity_component, 2),
        ),
        insights=insights,
    )


def _compute_mood_component(moods: list) -> float:
    if not moods:
        return 0.0
    scores = [m.score for m in moods]
    return (np.mean(scores) / 10.0) * 100.0


def _compute_stability_component(moods: list) -> float:
    """Low standard deviation = high stability."""
    if len(moods) < 2:
        return 50.0
    scores = [m.score for m in moods]
    std = np.std(scores)
    # Max expected std is ~4.5 for scores 1-10
    stability = max(0.0, (1.0 - std / 4.5)) * 100.0
    return stability


def _compute_sentiment_component(texts: list[str]) -> float:
    if not texts:
        return 50.0
    polarities = []
    for text in texts:
        result = analyze_sentiment(text)
        polarities.append(result["score"])
    avg_polarity = np.mean(polarities)
    # Map -1..1 to 0..100
    return (avg_polarity + 1.0) / 2.0 * 100.0


def _compute_activity_component(activities: list) -> float:
    if not activities:
        return 0.0
    unique_days = len(set(a.date for a in activities))
    # 7 active days in a week = 100%
    return min(100.0, (unique_days / 7.0) * 100.0)


def _assess_risk(score: float, moods: list) -> RiskLevel:
    if score < 30:
        return RiskLevel.HIGH
    if score < 55:
        return RiskLevel.MEDIUM

    # Check for sudden drops even with moderate overall score
    if len(moods) >= 3:
        recent_scores = [m.score for m in moods[-3:]]
        if any(s <= 2 for s in recent_scores):
            return RiskLevel.MEDIUM

    return RiskLevel.LOW


def _detect_trend(moods: list) -> Trend:
    """Linear regression slope on mood scores."""
    if len(moods) < 3:
        return Trend.STABLE
    scores = [m.score for m in moods]
    x = np.arange(len(scores))
    coeffs = np.polyfit(x, scores, 1)
    slope = coeffs[0]
    if slope > 0.15:
        return Trend.IMPROVING
    if slope < -0.15:
        return Trend.DECLINING
    return Trend.STABLE


def _generate_insights(
    score: float,
    mood_comp: float,
    sentiment_comp: float,
    activity_comp: float,
    trend: Trend,
) -> list[str]:
    insights = []

    if score >= 70:
        insights.append("Your overall wellbeing is in a healthy range. Keep it up!")
    elif score >= 40:
        insights.append("Your wellbeing is moderate. Small improvements can make a big difference.")
    else:
        insights.append("Your wellbeing score is low. Consider reaching out for support.")

    if mood_comp < 40:
        insights.append("Your recent mood scores are low. Mood-boosting activities like exercise or social connection may help.")
    if sentiment_comp < 35:
        insights.append("Your journal entries indicate negative emotional patterns. CBT exercises could be beneficial.")
    if activity_comp < 30:
        insights.append("Low activity detected. Even 10 minutes of mindful activity daily can significantly improve wellbeing.")

    if trend == Trend.IMPROVING:
        insights.append("Positive trend detected — your wellbeing has been improving recently.")
    elif trend == Trend.DECLINING:
        insights.append("A declining trend is detected. Pay attention to possible stressors and seek support if needed.")

    return insights
