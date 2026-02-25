"""
Statistics router for student analytics.

Provides endpoint for retrieving student performance statistics and history.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from backend.schemas import StatsResponse
from backend.services.stats_service import AnalyticsService
from backend.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stats/{student_id}", response_model=StatsResponse)
async def get_stats(student_id: int, db: Session = Depends(get_db)):
    """
    Retrieve student analytics.
    
    Args:
        student_id: Student identifier
        db: Database session (injected)
    
    Returns:
        StatsResponse with total_attempts, correct_attempts, accuracy, history
    
    Raises:
        HTTPException(404): If student not found
        HTTPException(500): If database query fails
        
    Example:
        GET /stats/1
        
        Response:
        {
            "total_attempts": 10,
            "correct_attempts": 7,
            "accuracy": 70.0,
            "history": [
                {
                    "timestamp": "2024-01-15T10:30:00",
                    "correct": true,
                    "problem": "x + 2 = 5"
                },
                ...
            ]
        }
    """
    try:
        logger.info(f"Retrieving stats for student {student_id}")
        
        # Get statistics from analytics service
        analytics_service = AnalyticsService(db)
        stats = analytics_service.get_student_stats(student_id)
        
        logger.info(
            f"Retrieved stats for student {student_id}: "
            f"total={stats['total_attempts']}, accuracy={stats['accuracy']:.1f}%"
        )
        
        return StatsResponse(
            total_attempts=stats["total_attempts"],
            correct_attempts=stats["correct_attempts"],
            accuracy=stats["accuracy"],
            history=stats["history"]
        )
    
    except ValueError as e:
        logger.warning(f"Student {student_id} not found: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"Student not found"
        )
    
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving stats for student {student_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
    
    except Exception as e:
        logger.error(
            f"Unexpected error retrieving stats for student {student_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
