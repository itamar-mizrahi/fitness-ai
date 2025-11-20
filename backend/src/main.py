"""
Main FastAPI application for AI Rehabilitation System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(
    title="AI Rehabilitation System API",
    description="Backend for AI-powered rehabilitation and tremor detection system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "AI Rehabilitation System API",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Import routers (will be added later)
# from src.api import auth, sessions, analytics, tremor, imbody
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
# app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
# app.include_router(tremor.router, prefix="/api/tremor", tags=["Tremor Detection"])
# app.include_router(imbody.router, prefix="/api/imbody", tags=["IMBODY"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
