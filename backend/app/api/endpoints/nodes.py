from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.api import schemas
from app.api.deps import get_current_user
from app.core.database import get_db
from app.services import node_service
from app.models.user import User

router = APIRouter()

@router.get("/workflow/{workflow_id}", response_model=List[schemas.NodeResponse])
def list_nodes(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return node_service.list_nodes(workflow_id=workflow_id, user_id=current_user.id, db=db)

@router.post("/", response_model=schemas.NodeResponse)
def create_node(
    request: schemas.NodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return node_service.create_node(
        workflow_id=request.workflow_id,
        user_id=current_user.id,
        node_type=request.type,
        position_x=request.position_x,
        position_y=request.position_y,
        config=request.config,
        db=db
    )

@router.put("/{node_id}", response_model=schemas.NodeResponse)
def update_node(
    node_id: str,
    request: schemas.NodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return node_service.update_node(
        node_id=node_id,
        user_id=current_user.id,
        node_type=request.type,
        position_x=request.position_x,
        position_y=request.position_y,
        config=request.config,
        db=db
    )

@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(
    node_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    node_service.delete_node(node_id=node_id, user_id=current_user.id, db=db)
    return None

# -- Edges --

@router.get("/workflow/{workflow_id}/edges", response_model=List[schemas.EdgeResponse])
def list_edges(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return node_service.list_edges(workflow_id=workflow_id, user_id=current_user.id, db=db)

@router.post("/edge", response_model=schemas.EdgeResponse)
def create_edge(
    request: schemas.EdgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return node_service.create_edge(
        workflow_id=request.workflow_id,
        user_id=current_user.id,
        source_node_id=request.source_node_id,
        target_node_id=request.target_node_id,
        source_handle=request.source_handle,
        target_handle=request.target_handle,
        db=db
    )

@router.delete("/edge/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_edge(
    edge_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    node_service.delete_edge(edge_id=edge_id, user_id=current_user.id, db=db)
    return None
