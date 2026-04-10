from fastapi import APIRouter
from models.schemas import SentimentRequest, SentimentResponse
from services.sentiment_service import analyze_sentiment

router = APIRouter(prefix="/analyze", tags=["Sentiment Analysis"])


@router.post("/sentiment", response_model=SentimentResponse)
async def analyze_sentiment_endpoint(data: SentimentRequest):
    """
    Analyze text sentiment using NLP.
    Returns sentiment label, polarity score, and subjectivity.
    """
    return analyze_sentiment(data.text)
