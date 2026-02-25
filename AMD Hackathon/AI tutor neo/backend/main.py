"""
MentorBoard Lite - AI-Powered Math Tutoring Application

Main FastAPI application with CORS, routing, and database initialization.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routers import hint, check, stats
from dotenv import load_dotenv
load_dotenv()
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    
    Handles:
    - Environment variable validation
    - Database initialization
    - Cleanup on shutdown
    """
    # Startup
    logger.info("Starting MentorBoard Lite backend...")
    
    # Validate required environment variables
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        logger.error("GROQ_API_KEY environment variable is not set!")
        raise ValueError(
            "GROQ_API_KEY must be set. "
            "Please copy .env.example to .env and add your API key."
        )
    
    logger.info("Environment variables validated")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise
    
    logger.info("MentorBoard Lite backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down MentorBoard Lite backend...")


# Create FastAPI application
app = FastAPI(
    title="MentorBoard Lite API",
    description="AI-powered math tutoring system with step-by-step guidance",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # Vite development server (alternative)
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(hint.router, tags=["Hints"])
app.include_router(check.router, tags=["Validation"])
app.include_router(stats.router, tags=["Statistics"])


@app.get("/")
async def root():
    """
    Root endpoint providing API information.
    
    Returns:
        dict: API metadata and available endpoints
    """
    return {
        "name": "MentorBoard Lite API",
        "version": "1.0.0",
        "description": "AI-powered math tutoring system",
        "endpoints": {
            "hint": "POST /hint - Generate AI hint for a problem",
            "check": "POST /check - Validate solution step",
            "stats": "GET /stats/{student_id} - Get student statistics"
        },
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        dict: Health status
    """
    return {
        "status": "healthy",
        "service": "MentorBoard Lite API"
    }


if __name__ == "__main__":
    import uvicorn
    
    # Run with uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
