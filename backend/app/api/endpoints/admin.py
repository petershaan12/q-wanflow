from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os
from app.api.deps import get_current_user
from app.models.user import User
from app.core.database import get_db

router = APIRouter()

def verify_admin(current_user: User):
    # Same as in users.py
    if current_user.email != "peterhiku12@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the super admin can access this resource."
        )

@router.get("/logs")
def get_logs(
    lines: int = 100,
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    
    log_file = "logs/app.log"
    if not os.path.exists(log_file):
        # Try relative to backend root
        log_file = os.path.join(os.getcwd(), "logs/app.log")
        if not os.path.exists(log_file):
             return {"logs": "Log file not found."}
    
    try:
        with open(log_file, "r") as f:
            # Read last N lines
            all_lines = f.readlines()
            last_lines = all_lines[-lines:] if lines > 0 else all_lines
            return {"logs": "".join(last_lines)}
    except Exception as e:
        return {"logs": f"Error reading logs: {str(e)}"}
