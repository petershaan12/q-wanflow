"""
app/services/node_service.py
──────────────────────────────
Node & Edge CRUD business logic.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.node import Node
from app.models.edge import Edge
from app.repository.node_repository import NodeRepository
from app.repository.edge_repository import EdgeRepository
from app.repository.workflow_repository import WorkflowRepository


from app.models.workflow import Workflow

def _assert_workflow_access(workflow_id: str, user_id: str, db: Session, require_edit: bool = False) -> Workflow:
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
        
    if wf.user_id == user_id:
        return wf
        
    if wf.share_permission == "private":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this workflow")
        
    if require_edit and wf.share_permission != "edit":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Edit access denied to this workflow")
        
    return wf


# ── Nodes ─────────────────────────────────────────────────────────────────────

def list_nodes(workflow_id: str, user_id: str, db: Session) -> list[Node]:
    _assert_workflow_access(workflow_id, user_id, db, require_edit=False)
    return NodeRepository(db).get_by_workflow(workflow_id)


def create_node(workflow_id: str, user_id: str, node_type: str,
                position_x: int, position_y: int, config: dict | None, db: Session) -> Node:
    require_edit = node_type != "comment"
    _assert_workflow_access(workflow_id, user_id, db, require_edit=require_edit)
    node = Node(workflow_id=workflow_id, type=node_type,
                position_x=position_x, position_y=position_y, config=config)
    return NodeRepository(db).create(node)


def update_node(node_id: str, user_id: str, node_type: str,
                position_x: int, position_y: int, config: dict | None, db: Session) -> Node:
    repo = NodeRepository(db)
    node = repo.get(node_id)
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
        
    require_edit = node_type != "comment"
    _assert_workflow_access(node.workflow_id, user_id, db, require_edit=require_edit)
    
    node.type = node_type
    node.position_x = position_x
    node.position_y = position_y
    node.config = config
    return repo.update(node)


def delete_node(node_id: str, user_id: str, db: Session) -> None:
    repo = NodeRepository(db)
    node = repo.get(node_id)
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
        
    is_comment = node.type == "comment"
    wf = _assert_workflow_access(node.workflow_id, user_id, db, require_edit=not is_comment)
    
    # If it's a comment and the user isn't the workflow owner, verify they own the comment node
    if is_comment and wf.user_id != user_id:
        original_user_id = node.config.get("user", {}).get("id")
        if original_user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comments")
            
    repo.delete(node)


# ── Edges ─────────────────────────────────────────────────────────────────────

def list_edges(workflow_id: str, user_id: str, db: Session) -> list[Edge]:
    _assert_workflow_access(workflow_id, user_id, db, require_edit=False)
    return EdgeRepository(db).get_by_workflow(workflow_id)


def create_edge(workflow_id: str, user_id: str,
                source_node_id: str, target_node_id: str,
                source_handle: str | None, target_handle: str | None,
                db: Session) -> Edge:
    _assert_workflow_access(workflow_id, user_id, db, require_edit=True)
    edge = Edge(workflow_id=workflow_id,
                source_node_id=source_node_id, target_node_id=target_node_id,
                source_handle=source_handle, target_handle=target_handle)
    return EdgeRepository(db).create(edge)


def delete_edge(edge_id: str, user_id: str, db: Session) -> None:
    repo = EdgeRepository(db)
    edge = repo.get(edge_id)
    if not edge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edge not found")
    _assert_workflow_access(edge.workflow_id, user_id, db, require_edit=True)
    repo.delete(edge)
