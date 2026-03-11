from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime

# ── Auth Schemas ─────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    plan: str = "free"
    profile_picture_url: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str

class ResendOTP(BaseModel):
    email: EmailStr

class UserPlanUpdate(BaseModel):
    plan: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture_url: Optional[str] = None

class GoogleLogin(BaseModel):
    credential: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

# ── Workflow Schemas ─────────────────────────────────────────────────────────

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkflowCreate(WorkflowBase):
    share_id: Optional[str] = None

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    share_permission: Optional[str] = None

class WorkflowResponse(WorkflowBase):
    id: str
    user_id: str
    share_id: str
    share_permission: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ── Node & Edge Schemas ──────────────────────────────────────────────────────

class NodeBase(BaseModel):
    type: str # input | prompt | qwen_text | wan_image | output
    position_x: int
    position_y: int
    config: Optional[Dict[str, Any]] = None

class NodeCreate(NodeBase):
    workflow_id: str

class NodeUpdate(NodeBase):
    pass

class NodeResponse(NodeBase):
    id: str
    workflow_id: str
    
    class Config:
        from_attributes = True

class EdgeBase(BaseModel):
    source_node_id: str
    target_node_id: str
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None

class EdgeCreate(EdgeBase):
    workflow_id: str

class EdgeResponse(EdgeBase):
    id: str
    workflow_id: str
    
    class Config:
        from_attributes = True

# ── Execution Schemas ────────────────────────────────────────────────────────

class WorkflowRunRequest(BaseModel):
    input_data: Dict[str, Any] = {}

class QwenApiKeyUpdate(BaseModel):
    api_key: str

class PromptEnhanceRequest(BaseModel):
    prompt: str


class ImageGenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    style: Optional[str] = None
    resolution: Optional[str] = None
    aspect_ratio: Optional[str] = "1:1"
    negative_prompt: Optional[str] = None
    reference_image_url: Optional[str] = None
    reference_image_urls: Optional[List[str]] = None
    size: Optional[str] = None
    n: Optional[int] = 1
    enable_interleave: Optional[bool] = None


class VideoGenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    duration: Optional[str] = None
    resolution: Optional[str] = None
    aspect_ratio: Optional[str] = "16:9"
    audio: Optional[bool] = True
    shot_type: Optional[str] = "single"
    audio_url: Optional[str] = None
    reference_image_url: Optional[str] = None
    reference_video_url: Optional[str] = None
    reference_urls: Optional[list] = None      # R2V: list of video/image URLs
    size: Optional[str] = None                 # T2V/R2V: pre-computed DashScope size e.g. '1280*720'
    negative_prompt: Optional[str] = None
    first_frame_url: Optional[str] = None
    last_frame_url: Optional[str] = None


# ── Asset Schemas ────────────────────────────────────────────────────────────

class AssetBase(BaseModel):
    name: str
    type: str
    content: Optional[str] = None
    file_path: Optional[str] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(AssetBase):
    pass


class TTSGenerateRequest(BaseModel):
    prompt: str
    voice: str
    model: str
    language: Optional[str] = "english"

class UserApiKeyResponse(BaseModel):
    id: int
    name: str
    api_key: str
    created_at: datetime

    class Config:
        from_attributes = True

class SupportRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

class AssetResponse(AssetBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
