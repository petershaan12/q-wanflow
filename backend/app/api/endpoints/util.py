from fastapi import APIRouter
from app.api import schemas
from app.utils.email import send_support_email

router = APIRouter()

@router.post("/support")
def contact_support(request: schemas.SupportRequest):
    """Handle support contact form."""
    send_support_email(
        user_email=request.email,
        user_name=request.name,
        message=request.message
    )
    return {"message": "Support message sent successfully"}
