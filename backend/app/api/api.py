from fastapi import APIRouter
from app.api.endpoints import auth, workflows, nodes, users, ai, assets, util, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(nodes.router, prefix="/nodes", tags=["nodes"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(util.router, prefix="/util", tags=["util"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
