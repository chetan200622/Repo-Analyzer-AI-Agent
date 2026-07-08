# Application configuration loaded from environment variables
import logging
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    APP_ENV: str = "development"
    APP_NAME: str = "Repo Analyzer"
    APP_VERSION: str = "0.1.0"
    FRONTEND_URL: str = "http://localhost:3001"
    BACKEND_URL: str = "http://localhost:8001"

    # PostgreSQL
    DATABASE_URL: str | None = None
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "repomind"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Qdrant (used in Feature 3+)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str | None = None

    # Ollama (used in Feature 4+)
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # AI Models (used in Feature 3+)
    LLM_MODEL: str = "qwen2.5-coder:7b"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # JWT (used when auth is implemented)
    JWT_SECRET: str = "change_this_secret"
    JWT_ALGORITHM: str = "HS256"

    # Analysis limits
    MAX_REPO_SIZE_MB: int = 100
    MAX_FILE_SIZE_MB: int = 2

    @property
    def database_url(self) -> str:
        """Construct PostgreSQL connection URL."""
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+psycopg://", 1)
            return url
            
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def async_database_url(self) -> str:
        """Construct PostgreSQL connection URL using psycopg3 dialect."""
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


# Singleton settings instance
settings = Settings()
