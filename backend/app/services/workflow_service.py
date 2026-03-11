"""
app/services/workflow_service.py
─────────────────────────────────
Workflow CRUD + execution engine (topological sort → node dispatch).
"""
from typing import Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import requests

from app.models.workflow import Workflow
from app.models.node import Node
from app.repository.workflow_repository import WorkflowRepository
from app.repository.node_repository import NodeRepository
from app.repository.edge_repository import EdgeRepository
from app.repository.api_key_repository import ApiKeyRepository
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ── CRUD ──────────────────────────────────────────────────────────────────────

def list_workflows(user_id: str, db: Session) -> list[Workflow]:
    return WorkflowRepository(db).get_by_user(user_id)


def get_workflow(workflow_id: str, user_id: str, db: Session) -> Workflow:
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
        
    if wf.user_id != user_id and wf.share_permission == "private":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This workflow is private")
        
    return wf


def get_workflow_by_share_id(share_id: str, db: Session) -> Workflow:
    wf = db.query(Workflow).filter(Workflow.share_id == share_id).first()
    if not wf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    
    if wf.share_permission == "private":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This workflow is private")
        
    return wf


def create_workflow(name: str, description: str | None, user_id: str, db: Session, share_id: str | None = None) -> Workflow:
    repo = WorkflowRepository(db)

    # Check Plan Limits
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.plan == "free":
        count = len(repo.get_by_user(user_id))
        if count >= user.get_project_limit():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project limit reached. You have created {count} of {user.get_project_limit()} projects. Upgrade to Pro for unlimited projects."
            )

    if share_id:
        existing = db.query(Workflow).filter(Workflow.share_id == share_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Share ID already exists")

    wf = Workflow(name=name, description=description, user_id=user_id)
    if share_id:
        wf.share_id = share_id

    created_wf = repo.create(wf)
    logger.info(f"Workflow created: '{name}' (ID: {created_wf.id}) by user {user_id}")
    return created_wf


def update_workflow(workflow_id: str, name: str | None, description: str | None, user_id: str, db: Session, share_permission: str | None = None) -> Workflow:
    repo = WorkflowRepository(db)
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
        
    if wf.user_id != user_id and wf.share_permission != "edit":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Edit access denied to this workflow")
        
    if name is not None:
        wf.name = name
    if description is not None:
        wf.description = description
    if share_permission and wf.user_id == user_id:
        wf.share_permission = share_permission
    return repo.update(wf)


def delete_workflow(workflow_id: str, user_id: str, db: Session) -> None:
    repo = WorkflowRepository(db)
    wf = repo.get_by_user_and_id(workflow_id, user_id)
    if not wf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    wf_name = wf.name
    repo.delete(wf)
    logger.info(f"Workflow deleted: '{wf_name}' (ID: {workflow_id}) by user {user_id}")


# ── Execution engine ─────────────────────────────────────────────────────────

def _get_api_key(user_id: str, db: Session) -> str:
    key = ApiKeyRepository(db).get_by_user_and_provider(user_id, "qwen")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Qwen API key not configured. Set it in Settings → API Key.",
        )
    return key.api_key


def _topological_sort(nodes: list[Node], edges) -> list[Node]:
    graph: dict[str, list[str]] = {n.id: [] for n in nodes}
    in_degree: dict[str, int] = {n.id: 0 for n in nodes}
    for e in edges:
        graph[e.source_node_id].append(e.target_node_id)
        in_degree[e.target_node_id] += 1

    queue = [n for n in nodes if in_degree[n.id] == 0]
    sorted_nodes: list[Node] = []
    while queue:
        cur = queue.pop(0)
        sorted_nodes.append(cur)
        for nid in graph[cur.id]:
            in_degree[nid] -= 1
            if in_degree[nid] == 0:
                queue.append(next(n for n in nodes if n.id == nid))

    if len(sorted_nodes) != len(nodes):
        raise HTTPException(status_code=400, detail="Workflow contains a cycle — cycles are not allowed")
    return sorted_nodes


def _call_qwen_text(prompt: str, model: str, temperature: float, max_tokens: int, api_key: str) -> str:
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "input": {"messages": [{"role": "user", "content": prompt}]},
        "parameters": {"temperature": temperature, "max_tokens": max_tokens},
    }
    resp = requests.post(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        headers=headers, json=payload, timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    choices = data.get("output", {}).get("choices", [])
    return choices[0]["message"]["content"] if choices else ""


def _call_wan_image(prompt: str, style: str, width: int, height: int, api_key: str) -> str:
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    # Use wanx-v2 which is the current model (wanx-v1 is deprecated)
    payload = {
        "model": "wanx-v2",
        "input": {"prompt": prompt, "n": 1, "size": {"width": width, "height": height}},
        "parameters": {"style": style if style != "Auto" else None},
    }
    resp = requests.post(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation",
        headers=headers, json=payload, timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    results = data.get("output", {}).get("results", [])
    return results[0]["url"] if results else ""


def _execute_node(node: Node, ctx: dict[str, Any], api_key: str) -> dict[str, Any]:
    cfg = node.config or {}

    if node.type == "input":
        return ctx.copy()

    if node.type == "prompt":
        template: str = cfg.get("prompt_template", "")
        for k, v in ctx.items():
            template = template.replace(f"{{{{{k}}}}}", str(v))
        return {"processed_prompt": template}

    if node.type == "qwen_text":
        prompt = cfg.get("prompt") or ctx.get("processed_prompt", "")
        text = _call_qwen_text(
            prompt=prompt,
            model=cfg.get("model", "qwen-max"),
            temperature=float(cfg.get("temperature", 0.7)),
            max_tokens=int(cfg.get("max_tokens", 1024)),
            api_key=api_key,
        )
        return {"generated_text": text}

    if node.type == "wan_image":
        prompt = cfg.get("prompt") or ctx.get("processed_prompt", "")
        w, h = map(int, cfg.get("resolution", "1024x1024").split("x"))
        url = _call_wan_image(
            prompt=prompt,
            style=cfg.get("style", "realistic"),
            width=w, height=h,
            api_key=api_key,
        )
        return {"image_url": url}

    if node.type == "output":
        return ctx.copy()

    raise HTTPException(status_code=400, detail=f"Unknown node type: {node.type!r}")


def run_workflow(workflow_id: str, user_id: str, input_data: dict, db: Session) -> dict:
    wf = get_workflow(workflow_id, user_id, db)
    logger.info(f"Executing workflow: '{wf.name}' (ID: {workflow_id}) for user {user_id}")
    nodes = NodeRepository(db).get_by_workflow(workflow_id)
    edges = EdgeRepository(db).get_by_workflow(workflow_id)

    if not nodes:
        raise HTTPException(status_code=400, detail="Workflow has no nodes")

    api_key = _get_api_key(user_id, db)
    sorted_nodes = _topological_sort(nodes, edges)

    node_outputs: dict[str, dict] = {}
    results = []
    ctx = input_data.copy()

    for node in sorted_nodes:
        for edge in edges:
            if edge.target_node_id == node.id and edge.source_node_id in node_outputs:
                ctx.update(node_outputs[edge.source_node_id])
        try:
            out = _execute_node(node, ctx, api_key)
            node_outputs[node.id] = out
            results.append({"node_id": node.id, "type": node.type, "output": out, "status": "success"})
            logger.info("Node %s (%s) succeeded", node.id, node.type)
        except Exception as exc:
            logger.error("Node %s (%s) failed: %s", node.id, node.type, exc)
            results.append({"node_id": node.id, "type": node.type, "output": {"error": str(exc)}, "status": "failed"})

    final_output: dict = {}
    for r in reversed(results):
        if r["type"] == "output":
            final_output = r["output"]
            break
    if not final_output and results:
        final_output = results[-1]["output"]

    return {"workflow_id": workflow_id, "results": results, "final_output": final_output}


# ── Project Limits ────────────────────────────────────────────────────────────

def get_workflow_limits(user_id: str, db: Session) -> dict:
    """Get workflow limits for a user"""
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    workflows = list_workflows(user_id, db)
    
    if user.plan == "pro":
        return {
            "plan": "pro",
            "project_limit": -1,
            "project_limit_human": "Unlimited",
            "project_count": len(workflows),
            "can_create": True
        }
    else:
        limit = 3
        return {
            "plan": "free",
            "project_limit": limit,
            "project_limit_human": str(limit),
            "project_count": len(workflows),
            "can_create": len(workflows) < limit
        }
