from fastapi import APIRouter
from models.schemas import WellbeingRequest, WellbeingResponse
from services.wellbeing_service import predict_wellbeing

router = APIRouter(prefix="/predict", tags=["Wellbeing Prediction"])


@router.post("/wellbeing", response_model=WellbeingResponse)
async def predict_wellbeing_endpoint(data: WellbeingRequest):
    """
    Predict composite wellbeing score from mood history,
    journal texts (sentiment), and activity data.
    """
    return predict_wellbeing(data)
