from textblob import TextBlob
from models.schemas import SentimentLabel


def analyze_sentiment(text: str) -> dict:
    """
    Analyze text sentiment using TextBlob.
    Returns polarity (-1.0 to 1.0) and subjectivity (0.0 to 1.0).

    TextBlob uses a pre-trained Naive Bayes model on movie reviews,
    which generalizes reasonably well to emotional/journal text.
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    if polarity > 0.1:
        label = SentimentLabel.POSITIVE
    elif polarity < -0.1:
        label = SentimentLabel.NEGATIVE
    else:
        label = SentimentLabel.NEUTRAL

    return {
        "sentiment": label,
        "score": round(polarity, 4),
        "subjectivity": round(subjectivity, 4),
    }
