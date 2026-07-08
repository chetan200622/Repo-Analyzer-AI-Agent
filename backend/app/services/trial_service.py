# Trial service — manages anonymous user free tier (1 repo + 15 chats)
import logging
import os
import secrets
from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.domain.models import TrialSession

logger = logging.getLogger(__name__)

FREE_REPO_LIMIT = 1
FREE_CHAT_LIMIT = 15
IS_DEV_MODE = os.getenv("APP_ENV", "development") == "development"


class TrialService:
    """Manages anonymous trial sessions for users without their own API key."""

    def get_or_create_session(self, db: Session, session_token: Optional[str]) -> Tuple[TrialSession, bool]:
        """
        Gets existing session or creates a new one.
        Returns (session, is_new).
        """
        if session_token:
            existing = db.query(TrialSession).filter(
                TrialSession.session_token == session_token
            ).first()
            if existing:
                return existing, False

        # Create new session
        new_token = secrets.token_hex(32)
        session = TrialSession(session_token=new_token)
        db.add(session)
        db.commit()
        db.refresh(session)
        logger.info(f"Created new trial session: {new_token[:8]}...")
        return session, True

    def check_chat_quota(self, db: Session, session_token: str) -> Tuple[bool, int]:
        """
        Check if user can send a chat message.
        Returns (allowed, remaining).
        """
        if IS_DEV_MODE:
            return True, 999
        session = db.query(TrialSession).filter(
            TrialSession.session_token == session_token
        ).first()

        if not session:
            return False, 0

        remaining = max(0, FREE_CHAT_LIMIT - session.chat_messages_used)
        return session.can_chat, remaining

    def use_chat_quota(self, db: Session, session_token: str) -> bool:
        """Consume 1 chat message from trial quota. Returns True if successful."""
        if IS_DEV_MODE:
            return True
        session = db.query(TrialSession).filter(
            TrialSession.session_token == session_token
        ).first()

        if not session or not session.can_chat:
            return False

        session.chat_messages_used += 1
        session.last_used_at = datetime.utcnow()
        db.commit()
        logger.info(f"Trial session {session_token[:8]}... used chat {session.chat_messages_used}/{FREE_CHAT_LIMIT}")
        return True

    def check_repo_quota(self, db: Session, session_token: str) -> Tuple[bool, int]:
        """
        Check if user can analyze a repo.
        Returns (allowed, remaining).
        """
        if IS_DEV_MODE:
            return True, 999
        session = db.query(TrialSession).filter(
            TrialSession.session_token == session_token
        ).first()

        if not session:
            return False, 0

        remaining = max(0, FREE_REPO_LIMIT - session.repos_analyzed)
        return session.can_analyze_repo, remaining

    def use_repo_quota(self, db: Session, session_token: str) -> bool:
        """Consume 1 repo analysis from trial quota. Returns True if successful."""
        if IS_DEV_MODE:
            return True
        session = db.query(TrialSession).filter(
            TrialSession.session_token == session_token
        ).first()

        if not session or not session.can_analyze_repo:
            return False

        session.repos_analyzed += 1
        session.last_used_at = datetime.utcnow()
        db.commit()
        logger.info(f"Trial session {session_token[:8]}... used repo analysis {session.repos_analyzed}/{FREE_REPO_LIMIT}")
        return True

    def get_usage_info(self, db: Session, session_token: str) -> dict:
        """Get current usage stats for a trial session."""
        session = db.query(TrialSession).filter(
            TrialSession.session_token == session_token
        ).first()

        if not session:
            return {
                "has_session": False,
                "repos_used": 0, "repos_limit": FREE_REPO_LIMIT,
                "chats_used": 0, "chats_limit": FREE_CHAT_LIMIT,
            }

        return {
            "has_session": True,
            "repos_used": session.repos_analyzed,
            "repos_limit": FREE_REPO_LIMIT,
            "repos_remaining": max(0, FREE_REPO_LIMIT - session.repos_analyzed),
            "chats_used": session.chat_messages_used,
            "chats_limit": FREE_CHAT_LIMIT,
            "chats_remaining": max(0, FREE_CHAT_LIMIT - session.chat_messages_used),
        }


trial_service = TrialService()
