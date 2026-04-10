import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ForMyMind AI Service"


class TestSentimentEndpoint:
    def test_positive_sentiment(self):
        response = client.post(
            "/analyze/sentiment",
            json={"text": "I feel wonderful today! Life is great and I am so happy."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sentiment"] == "positive"
        assert data["score"] > 0

    def test_negative_sentiment(self):
        response = client.post(
            "/analyze/sentiment",
            json={"text": "I feel terrible and hopeless. Nothing is going right."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sentiment"] == "negative"
        assert data["score"] < 0

    def test_neutral_sentiment(self):
        response = client.post(
            "/analyze/sentiment",
            json={"text": "Today I went to the store and bought some groceries."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sentiment"] in ["neutral", "positive"]

    def test_empty_text_rejected(self):
        response = client.post("/analyze/sentiment", json={"text": ""})
        assert response.status_code == 422


class TestWellbeingEndpoint:
    def test_predict_wellbeing_good_data(self):
        response = client.post(
            "/predict/wellbeing",
            json={
                "moods": [
                    {"score": 8, "level": "GOOD", "date": "2026-04-01"},
                    {"score": 7, "level": "GOOD", "date": "2026-04-02"},
                    {"score": 9, "level": "EXCELLENT", "date": "2026-04-03"},
                    {"score": 8, "level": "GOOD", "date": "2026-04-04"},
                ],
                "journal_texts": [
                    "I had a great day today, feeling optimistic about the future.",
                    "Spent quality time with friends, feeling grateful.",
                ],
                "activities": [
                    {"category": "MEDITATION", "date": "2026-04-01", "duration_min": 15},
                    {"category": "PHYSICAL", "date": "2026-04-02", "duration_min": 30},
                    {"category": "BREATHING", "date": "2026-04-03", "duration_min": 10},
                ],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["wellbeing_score"] > 50
        assert data["risk_level"] == "low"
        assert "breakdown" in data
        assert len(data["insights"]) > 0

    def test_predict_wellbeing_low_data(self):
        response = client.post(
            "/predict/wellbeing",
            json={
                "moods": [
                    {"score": 2, "level": "VERY_LOW", "date": "2026-04-01"},
                    {"score": 1, "level": "VERY_LOW", "date": "2026-04-02"},
                    {"score": 3, "level": "LOW", "date": "2026-04-03"},
                ],
                "journal_texts": [
                    "I feel terrible, nothing matters anymore.",
                ],
                "activities": [],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["wellbeing_score"] < 40
        assert data["risk_level"] in ["medium", "high"]

    def test_predict_wellbeing_empty_moods(self):
        response = client.post(
            "/predict/wellbeing",
            json={"moods": [], "journal_texts": [], "activities": []},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["wellbeing_score"] >= 0

    def test_predict_wellbeing_trend_improving(self):
        response = client.post(
            "/predict/wellbeing",
            json={
                "moods": [
                    {"score": 3, "level": "LOW", "date": "2026-04-01"},
                    {"score": 5, "level": "NEUTRAL", "date": "2026-04-02"},
                    {"score": 7, "level": "GOOD", "date": "2026-04-03"},
                    {"score": 8, "level": "GOOD", "date": "2026-04-04"},
                ],
                "journal_texts": [],
                "activities": [],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["trend"] == "improving"
