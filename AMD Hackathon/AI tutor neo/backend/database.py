"""
Database configuration and session management for MentorBoard Lite.

This module sets up SQLAlchemy engine, session factory, and provides
database dependency injection for FastAPI endpoints.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Database URL from environment or default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mentorboard.db")

# Create SQLAlchemy engine
# For SQLite, we need check_same_thread=False to allow FastAPI's async usage
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.
    
    Yields:
        Session: SQLAlchemy database session
        
    Usage:
        @app.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            # Use db session here
            pass
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database by creating all tables.
    
    This function should be called on application startup to ensure
    all database tables exist before handling requests.
    """
    from backend import models  # Import models to register them with Base
    Base.metadata.create_all(bind=engine)
