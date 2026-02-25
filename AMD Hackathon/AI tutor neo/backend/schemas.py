"""
Pydantic schemas for request validation and response serialization.

Defines data models for API requests and responses with validation rules.
"""

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field, field_validator


# Request Schemas

class HintRequest(BaseModel):
    """
    Request schema for hint generation endpoint.
    
    Attributes:
        student_id: Unique identifier for the student
        problem: Mathematical problem to get hint for
        level: Difficulty level (beginner/intermediate/advanced)
    """
    student_id: int = Field(..., gt=0, description="Student ID must be positive")
    problem: str = Field(..., min_length=1, max_length=500, description="Math problem")
    level: str = Field(..., description="Difficulty level")
    
    @field_validator('level')
    @classmethod
    def validate_level(cls, v: str) -> str:
        """Validate level is one of the allowed values."""
        allowed = ['beginner', 'intermediate', 'advanced']
        if v not in allowed:
            raise ValueError(f"Level must be one of: {', '.join(allowed)}")
        return v


class ValidationRequest(BaseModel):
    """
    Request schema for solution step validation endpoint.
    
    Attributes:
        student_id: Unique identifier for the student
        problem: Original mathematical problem
        student_step: Student's attempted solution step
    """
    student_id: int = Field(..., gt=0, description="Student ID must be positive")
    problem: str = Field(..., min_length=1, max_length=500, description="Original problem")
    student_step: str = Field(..., min_length=1, max_length=500, description="Student's step")


# Response Schemas

class HintResponse(BaseModel):
    """
    Response schema for hint generation.
    
    Attributes:
        hint: Step-by-step guidance text
        next_question: Guiding question to encourage thinking
        difficulty: Assessed difficulty level
    """
    hint: str = Field(..., max_length=1000, description="Hint text")
    next_question: str = Field(..., max_length=500, description="Guiding question")
    difficulty: str = Field(..., description="Difficulty assessment")
    
    @field_validator('difficulty')
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        """Validate difficulty is one of the allowed values."""
        allowed = ['easy', 'medium', 'hard']
        if v not in allowed:
            raise ValueError(f"Difficulty must be one of: {', '.join(allowed)}")
        return v


class ValidationResponse(BaseModel):
    """
    Response schema for solution step validation.
    
    Attributes:
        correct: Whether the step is mathematically correct
        feedback: Explanatory feedback for the student
    """
    correct: bool = Field(..., description="Whether step is correct")
    feedback: str = Field(..., max_length=1000, description="Feedback message")


class AttemptHistoryItem(BaseModel):
    """
    Schema for a single attempt in history.
    
    Attributes:
        timestamp: When the attempt was made (ISO format)
        correct: Whether the attempt was correct
        problem: The problem that was attempted
    """
    timestamp: str = Field(..., description="ISO format timestamp")
    correct: bool = Field(..., description="Whether attempt was correct")
    problem: str = Field(..., description="Problem attempted")


class StatsResponse(BaseModel):
    """
    Response schema for student statistics.
    
    Attributes:
        total_attempts: Total number of attempts made
        correct_attempts: Number of correct attempts
        accuracy: Percentage of correct attempts (0-100)
        history: List of recent attempts
    """
    total_attempts: int = Field(..., ge=0, description="Total attempts")
    correct_attempts: int = Field(..., ge=0, description="Correct attempts")
    accuracy: float = Field(..., ge=0.0, le=100.0, description="Accuracy percentage")
    history: List[AttemptHistoryItem] = Field(default_factory=list, description="Attempt history")


class ErrorResponse(BaseModel):
    """
    Standard error response schema.
    
    Attributes:
        detail: Error message
    """
    detail: str = Field(..., description="Error message")
