from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.models import Base
from app.core.database import engine
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Q-WanFlow AI Platform"
)

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")

# Ensure static folder exists
os.makedirs("static/profile_pictures", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return {"message": "Welcome to Q-WanFlow API", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
