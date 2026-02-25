"""
Hint generation router for AI-powered math tutoring.

Provides endpoint for generating pedagogical hints using LLM service.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import HintRequest, HintResponse
from backend.services.llm_service import LLMService
from backend.database import get_db
import os
from dotenv import load_dotenv
load_dotenv()
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize LLM service
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    logger.error("GROQ_API_KEY environment variable not set")
    raise ValueError("GROQ_API_KEY must be set")

llm_service = LLMService(api_key=groq_api_key)


@router.post("/hint", response_model=HintResponse)
async def get_hint(request: HintRequest, db: Session = Depends(get_db)):
    """
    Generate AI hint for a math problem.
    
    Args:
        request: Contains student_id, problem, level
        db: Database session (injected)
    
    Returns:
        HintResponse with hint, next_question, difficulty
    
    Raises:
        HTTPException(503): If Groq API fails
        HTTPException(500): If unexpected error occurs
        
    Example:
        POST /hint
        {
            "student_id": 1,
            "problem": "x^2 + 3x = 5",
            "level": "beginner"
        }
        
        Response:
        {
            "hint": "Start by moving all terms to one side...",
            "next_question": "What form should the equation be in?",
            "difficulty": "medium"
        }
    """
    try:
        logger.info(f"Generating hint for student {request.student_id}: {request.problem}")
        
        # Call LLM service to generate hint
        result = await llm_service.get_hint(request.problem, request.level)
        
        logger.info(f"Successfully generated hint for student {request.student_id}")
        
        return HintResponse(
            hint=result["hint"],
            next_question=result["next_question"],
            difficulty=result["difficulty"]
        )
    
    except Exception as e:
        logger.error(f"Error generating hint: {str(e)}")
        
        # Check if it's a timeout or API error
        if "timeout" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="AI service timeout. Please try again."
            )
        else:
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable"
            )
