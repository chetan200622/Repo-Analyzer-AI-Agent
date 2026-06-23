# Health check endpoint — verifies API, database, and Redis connectivity
import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.config import settings
from app.domain.schemas import HealthResponse
from app.infrastructure.redis_client import check_redis_health

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """Check the health of the API, database, and Redis."""

    # Check database
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error("Database health check failed: %s", e)
        db_status = "unhealthy"

    # Check Redis
    redis_status = "healthy" if check_redis_health() else "unhealthy"

    # Overall status
    overall = "healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded"

    return HealthResponse(
        status=overall,
        version=settings.APP_VERSION,
        database=db_status,
        redis=redis_status,
        timestamp=datetime.utcnow(),
    )
