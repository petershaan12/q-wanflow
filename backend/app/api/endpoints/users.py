from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import schemas
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

def verify_admin(current_user: User):
    if current_user.email != "peterhiku12@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the super admin can access this resource."
        )

@router.get("", response_model=List[schemas.UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    users = db.query(User).all()
    print(f"DEBUG: Admin listing users. Found {len(users)} users.")
    for u in users:
        print(f"DEBUG: User {u.email} profile_picture_url={u.profile_picture_url}")
    return users

@router.put("/{user_id}/plan", response_model=schemas.UserResponse)
def update_user_plan(
    user_id: str,
    request: schemas.UserPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.plan = request.plan
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: str,
    request: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.name is not None:
        user.name = request.name
    if request.profile_picture_url is not None:
        user.profile_picture_url = request.profile_picture_url
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.email == "peterhiku12@gmail.com":
        raise HTTPException(status_code=400, detail="Cannot delete the super admin account.")

    db.delete(user)
    db.commit()
    return None
