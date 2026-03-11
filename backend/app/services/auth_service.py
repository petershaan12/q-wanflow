from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
from app.models.user import User
from app.repository.user_repository import UserRepository
from app.core.security import create_access_token, verify_google_token, verify_password, get_password_hash
from app.api import schemas
from app.utils.logger import get_logger
from app.utils.email import generate_otp, send_otp_email

logger = get_logger(__name__)


def _token_response(user: User) -> dict:
    token = create_access_token(subject=user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id, 
            "email": user.email, 
            "name": user.name,
            "plan": user.plan,
            "profile_picture_url": user.profile_picture_url,
            "is_verified": user.is_verified
        },
    }


def google_oauth(credential: str, db: Session) -> dict:
    """Handle Google OAuth verification and user creation/lookup."""
    claims = verify_google_token(credential)
    email: str = claims["email"]
    google_id: str = claims["sub"]
    name: str | None = claims.get("name")
    picture: str | None = claims.get("picture")  # Google profile picture URL

    repo = UserRepository(db)
    user = repo.get_by_google_id(google_id)
    if not user:
        # Check if user exists with this email but no google_id
        user = repo.get_by_email(email)
        if user:
            logger.info(f"Linking existing user {email} to Google ID")
            user.google_id = google_id
            # Update profile picture if available and not already set
            if picture and not user.profile_picture_url:
                user.profile_picture_url = picture
            repo.save()
        else:
            # Create new user
            logger.info(f"Creating new user from Google OAuth: {email}")
            user_data = {"email": email, "name": name, "google_id": google_id, "is_verified": True}
            if picture:
                user_data["profile_picture_url"] = picture
            user = repo.create(User(**user_data))
    else:
        # Update profile picture if available and not already set
        if picture and not user.profile_picture_url:
            user.profile_picture_url = picture
            repo.save()

    logger.info(f"User logged in successfully: {email}")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    return _token_response(user)


def register_user(user_in: schemas.UserCreate, db: Session) -> User:
    """Register a new user with email and password."""
    repo = UserRepository(db)
    if repo.email_exists(user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    otp_code = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    user_data = user_in.model_dump(exclude={"password"})
    user_data["hashed_password"] = get_password_hash(user_in.password)
    user_data["otp_code"] = otp_code
    user_data["otp_expiry"] = otp_expiry
    user_data["is_verified"] = False
    
    user = repo.create(User(**user_data))
    
    # Send OTP email
    send_otp_email(user.email, otp_code)
    
    return user


def authenticate_user(login_data: schemas.UserLogin, db: Session) -> dict:
    """Authenticate user with email and password."""
    repo = UserRepository(db)
    user = repo.get_by_email(login_data.email)
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
        
    if not user.is_verified:
        # Auto-resend OTP on login attempt if not verified
        otp_code = generate_otp()
        user.otp_code = otp_code
        user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        repo.save()
        send_otp_email(user.email, otp_code)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not verified. A new OTP has been sent to your email.",
            headers={"X-Account-Verified": "false"}
        )
        
    return _token_response(user)


def verify_otp(verify_data: schemas.VerifyOTP, db: Session) -> dict:
    """Verify OTP and activate user account."""
    repo = UserRepository(db)
    user = repo.get_by_email(verify_data.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    if user.is_verified:
        return _token_response(user)
        
    if not user.otp_code or user.otp_code != verify_data.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code",
        )
        
    if user.otp_expiry and user.otp_expiry < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired",
        )
        
    user.is_verified = True
    user.otp_code = None
    user.otp_expiry = None
    repo.save()
    
    return _token_response(user)


def resend_otp(resend_data: schemas.ResendOTP, db: Session) -> dict:
    """Resend OTP code to user's email."""
    repo = UserRepository(db)
    user = repo.get_by_email(resend_data.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already verified",
        )
        
    otp_code = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    user.otp_code = otp_code
    user.otp_expiry = otp_expiry
    repo.save()
    
    send_otp_email(user.email, otp_code)
    
    return {"message": "OTP code resent successfully"}
