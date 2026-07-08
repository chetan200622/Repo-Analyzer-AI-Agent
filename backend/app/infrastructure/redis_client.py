# Redis client and job queue setup
import logging

import redis
from rq import Queue

from app.core.config import settings

logger = logging.getLogger(__name__)

# Redis connection instance
redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    health_check_interval=30,
)

# RQ job queue for background analysis tasks
analysis_queue = Queue("analysis", connection=redis.Redis.from_url(settings.REDIS_URL, health_check_interval=30))


def get_redis() -> redis.Redis:
    """Return the Redis client instance."""
    return redis_client


def check_redis_health() -> bool:
    """Check if Redis is reachable."""
    try:
        redis_client.ping()
        return True
    except redis.ConnectionError:
        logger.error("Redis connection failed")
        return False
