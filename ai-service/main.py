from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.wellbeing import router as wellbeing_router
from routes.sentiment import router as sentiment_router
from models.schemas import HealthResponse

app = FastAPI(
    title="ForMyMind AI Service",
    description="Machine learning microservice for mental wellbeing prediction and sentiment analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wellbeing_router)
app.include_router(sentiment_router)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="ForMyMind AI Service",
        version="1.0.0",
    )
