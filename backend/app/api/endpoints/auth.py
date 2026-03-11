from fastapi import APIRouter, Depends, status, UploadFile, File, Response, HTTPException
from sqlalchemy.orm import Session
from app.api import schemas
from app.core.database import get_db
from app.services import auth_service
from app.api.deps import get_current_user
from app.models.user import User
from app.core.config import settings
import os
import shutil
import uuid

router = APIRouter()

def _set_auth_cookie(response: Response, access_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7, # 7 days
        expires=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False, # Set True in production with HTTPS
        path="/",
    )

@router.post("/register", response_model=schemas.UserResponse)
def register(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    return auth_service.register_user(user_in=user_in, db=db)

@router.post("/login", response_model=schemas.Token)
def login(
    request: schemas.UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login with email and password."""
    data = auth_service.authenticate_user(login_data=request, db=db)
    _set_auth_cookie(response, data["access_token"])
    return data

@router.post("/verify-otp", response_model=schemas.Token)
def verify_otp(
    request: schemas.VerifyOTP,
    response: Response,
    db: Session = Depends(get_db)
):
    """Verify OTP code."""
    data = auth_service.verify_otp(verify_data=request, db=db)
    _set_auth_cookie(response, data["access_token"])
    return data

@router.post("/resend-otp")
def resend_otp(
    request: schemas.ResendOTP,
    db: Session = Depends(get_db)
):
    """Resend OTP code."""
    return auth_service.resend_otp(resend_data=request, db=db)

@router.post("/google", response_model=schemas.Token)
def google_auth(
    request: schemas.GoogleLogin, 
    response: Response,
    db: Session = Depends(get_db)
):
    """Google OAuth login."""
    data = auth_service.google_oauth(credential=request.credential, db=db)
    _set_auth_cookie(response, data["access_token"])
    return data

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=schemas.UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/me/profile-picture")
def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure standard extension (e.g. .jpg, .png)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join("static", "profile_pictures", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url = f"/static/profile_pictures/{filename}"
    current_user.profile_picture_url = url
    db.commit()
    db.refresh(current_user)
    
    return {"url": url}
