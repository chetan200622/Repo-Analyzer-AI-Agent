# Shared FastAPI dependencies for route handlers
from collections.abc import Generator

from sqlalchemy.orm import Session

from app.infrastructure.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for request-scoped dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
