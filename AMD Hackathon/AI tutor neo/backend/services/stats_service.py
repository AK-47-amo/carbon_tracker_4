"""
Analytics service for computing and managing student statistics.

This module provides functions for recording attempts and retrieving
student performance analytics from the database.
"""

import logging
from datetime import datetime
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from backend.models import Student, Attempt, Stats

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Service for managing student statistics and attempt records.
    
    Provides methods to record attempts, update statistics, and retrieve
    performance analytics for students.
    """
    
    def __init__(self, db: Session):
        """
        Initialize analytics service with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def get_student_stats(self, student_id: int) -> Dict:
        """
        Compute student statistics from database.
        
        Args:
            student_id: Student identifier
        
        Returns:
            dict with:
                - total_attempts (int): Total number of attempts
                - correct_attempts (int): Number of correct attempts
                - accuracy (float): Percentage of correct attempts
                - history (list): List of attempt records with timestamps
        
        Raises:
            ValueError: If student not found
            SQLAlchemyError: If database query fails
            
        Examples:
            >>> service = AnalyticsService(db)
            >>> stats = service.get_student_stats(1)
            >>> print(stats['accuracy'])
            75.5
        """
        try:
            # Check if student exists
            student = self.db.query(Student).filter(Student.id == student_id).first()
            if not student:
                raise ValueError(f"Student with id {student_id} not found")
            
            # Get or create stats record
            stats = self.db.query(Stats).filter(Stats.student_id == student_id).first()
            if not stats:
                stats = Stats(
                    student_id=student_id,
                    total_attempts=0,
                    correct_attempts=0,
                    accuracy=0.0
                )
                self.db.add(stats)
                self.db.commit()
            
            # Get attempt history ordered by timestamp
            attempts = (
                self.db.query(Attempt)
                .filter(Attempt.student_id == student_id)
                .order_by(Attempt.timestamp.desc())
                .all()
            )
            
            # Format history
            history = [
                {
                    "timestamp": attempt.timestamp.isoformat(),
                    "correct": attempt.correct,
                    "problem": attempt.problem
                }
                for attempt in attempts
            ]
            
            return {
                "total_attempts": stats.total_attempts,
                "correct_attempts": stats.correct_attempts,
                "accuracy": stats.accuracy,
                "history": history
            }
        
        except SQLAlchemyError as e:
            logger.error(f"Database error getting stats for student {student_id}: {str(e)}")
            raise
    
    def record_attempt(
        self,
        student_id: int,
        problem: str,
        student_step: str,
        correct: bool
    ) -> None:
        """
        Record a new attempt in the database and update statistics.
        
        Args:
            student_id: Student identifier
            problem: Original problem
            student_step: Student's solution step
            correct: Whether the step was correct
        
        Raises:
            ValueError: If student not found
            SQLAlchemyError: If database operation fails
            
        Examples:
            >>> service = AnalyticsService(db)
            >>> service.record_attempt(1, "x + 2 = 5", "x = 3", True)
        """
        try:
            # Check if student exists, create if not
            student = self.db.query(Student).filter(Student.id == student_id).first()
            if not student:
                # Create default student
                student = Student(id=student_id, name=f"Student {student_id}")
                self.db.add(student)
                self.db.flush()
            
            # Create attempt record
            attempt = Attempt(
                student_id=student_id,
                problem=problem,
                student_step=student_step,
                correct=correct,
                timestamp=datetime.utcnow()
            )
            self.db.add(attempt)
            
            # Get or create stats record
            stats = self.db.query(Stats).filter(Stats.student_id == student_id).first()
            if not stats:
                stats = Stats(
                    student_id=student_id,
                    total_attempts=0,
                    correct_attempts=0,
                    accuracy=0.0
                )
                self.db.add(stats)
            
            # Update statistics
            stats.total_attempts += 1
            if correct:
                stats.correct_attempts += 1
            
            # Calculate accuracy
            if stats.total_attempts > 0:
                stats.accuracy = (stats.correct_attempts / stats.total_attempts) * 100
            else:
                stats.accuracy = 0.0
            
            # Commit transaction atomically
            self.db.commit()
            
            logger.info(
                f"Recorded attempt for student {student_id}: "
                f"correct={correct}, total={stats.total_attempts}"
            )
        
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error recording attempt for student {student_id}: {str(e)}")
            raise
