from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.api import schemas
from app.api.deps import get_current_user
from app.core.database import get_db
from app.services import workflow_service
from app.models.user import User

router = APIRouter()

@router.get("/limits")
def get_workflow_limits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get workflow limits for current user"""
    return workflow_service.get_workflow_limits(user_id=current_user.id, db=db)

@router.get("/", response_model=List[schemas.WorkflowResponse])
def list_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return workflow_service.list_workflows(user_id=current_user.id, db=db)

@router.post("/", response_model=schemas.WorkflowResponse)
def create_workflow(
    request: schemas.WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return workflow_service.create_workflow(
        name=request.name, 
        description=request.description, 
        user_id=current_user.id, 
        db=db,
        share_id=request.share_id
    )

@router.get("/{workflow_id}", response_model=schemas.WorkflowResponse)
def get_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return workflow_service.get_workflow(workflow_id=workflow_id, user_id=current_user.id, db=db)

@router.put("/{workflow_id}", response_model=schemas.WorkflowResponse)
def update_workflow(
    workflow_id: str,
    request: schemas.WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return workflow_service.update_workflow(
        workflow_id=workflow_id,
        name=request.name,
        description=request.description,
        user_id=current_user.id,
        db=db,
        share_permission=request.share_permission
    )

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workflow_service.delete_workflow(workflow_id=workflow_id, user_id=current_user.id, db=db)
    return None

@router.get("/share/{share_id}", response_model=schemas.WorkflowResponse)
def get_workflow_by_share_id(
    share_id: str,
    db: Session = Depends(get_db)
):
    return workflow_service.get_workflow_by_share_id(share_id=share_id, db=db)


@router.post("/{workflow_id}/run")
def run_workflow(
    workflow_id: str,
    request: schemas.WorkflowRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return workflow_service.run_workflow(
        workflow_id=workflow_id,
        user_id=current_user.id,
        input_data=request.input_data,
        db=db
    )
