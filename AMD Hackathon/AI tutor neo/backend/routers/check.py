"""
Solution validation router for checking student work.

Provides endpoint for validating mathematical solution steps and recording attempts.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from backend.schemas import ValidationRequest, ValidationResponse
from backend.services.math_validator import MathValidator, ParseError
from backend.services.stats_service import AnalyticsService
from backend.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize math validator
math_validator = MathValidator()


@router.post("/check", response_model=ValidationResponse)
async def check_step(request: ValidationRequest, db: Session = Depends(get_db)):
    """
    Validate student's solution step.
    
    Args:
        request: Contains student_id, problem, student_step
        db: Database session (injected)
    
    Returns:
        ValidationResponse with correct boolean and feedback
    
    Raises:
        HTTPException(400): If math expression cannot be parsed
        HTTPException(500): If database operation fails
        
    Example:
        POST /check
        {
            "student_id": 1,
            "problem": "x + 2 = 5",
            "student_step": "x = 3"
        }
        
        Response:
        {
            "correct": true,
            "feedback": "Correct! Your step is mathematically valid."
        }
    """
    try:
        logger.info(
            f"Validating step for student {request.student_id}: "
            f"problem='{request.problem}', step='{request.student_step}'"
        )
        
        # Validate the mathematical step
        result = math_validator.validate_step(request.problem, request.student_step)
        
        # Record the attempt in database
        analytics_service = AnalyticsService(db)
        analytics_service.record_attempt(
            student_id=request.student_id,
            problem=request.problem,
            student_step=request.student_step,
            correct=result["correct"]
        )
        
        logger.info(
            f"Validation complete for student {request.student_id}: "
            f"correct={result['correct']}"
        )
        
        return ValidationResponse(
            correct=result["correct"],
            feedback=result["feedback"]
        )
    
    except ParseError as e:
        logger.error(
            f"Parse error for student {request.student_id}: {str(e)}, "
            f"problem='{request.problem}', step='{request.student_step}'"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Cannot parse expression: {str(e)}"
        )
    
    except SQLAlchemyError as e:
        logger.error(
            f"Database error for student {request.student_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
    
    except Exception as e:
        logger.error(
            f"Unexpected error validating step for student {request.student_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
