"""
Database models for MentorBoard Lite.

Defines SQLAlchemy ORM models for Student, Attempt, and Stats tables
with proper relationships and constraints.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class Student(Base):
    """
    Student model representing a user of the tutoring system.
    
    Attributes:
        id: Primary key, auto-incrementing student identifier
        name: Student's name
        created_at: Timestamp when student record was created
        attempts: Relationship to all attempts made by this student
        stats: Relationship to student's statistics (one-to-one)
    """
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    attempts = relationship("Attempt", back_populates="student", cascade="all, delete-orphan")
    stats = relationship("Stats", back_populates="student", uselist=False, cascade="all, delete-orphan")


class Attempt(Base):
    """
    Attempt model representing a student's solution step submission.
    
    Attributes:
        id: Primary key, auto-incrementing attempt identifier
        student_id: Foreign key to Student table
        problem: The original math problem
        student_step: The student's attempted solution step
        correct: Boolean indicating if the step was correct
        timestamp: When the attempt was made
        student: Relationship to the Student who made this attempt
    """
    __tablename__ = "attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    problem = Column(String, nullable=False)
    student_step = Column(String, nullable=False)
    correct = Column(Boolean, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    student = relationship("Student", back_populates="attempts")


class Stats(Base):
    """
    Stats model representing aggregated statistics for a student.
    
    Attributes:
        id: Primary key, auto-incrementing stats identifier
        student_id: Foreign key to Student table (unique constraint)
        total_attempts: Total number of attempts made
        correct_attempts: Number of correct attempts
        accuracy: Percentage of correct attempts (0-100)
        student: Relationship to the Student these stats belong to
    """
    __tablename__ = "stats"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False, index=True)
    total_attempts = Column(Integer, default=0, nullable=False)
    correct_attempts = Column(Integer, default=0, nullable=False)
    accuracy = Column(Float, default=0.0, nullable=False)
    
    # Relationships
    student = relationship("Student", back_populates="stats")
