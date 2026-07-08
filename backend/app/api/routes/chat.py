# Chat API routes with Gemini BYOK + trial system
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid

from app.services.rag_service import rag_service
from app.services.trial_service import trial_service
from app.infrastructure.database import SessionLocal
from app.domain.models import ChatMessage as DBChatMessage

logger = logging.getLogger(__name__)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ChatMessage(BaseModel):
    role: str
    content: str
    sources: Any = None


class ChatRequest(BaseModel):
    repo_id: str
    message: str
    history: List[ChatMessage] = []


class ChatSource(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    symbol_name: str | None = None
    code: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource]


@router.get("/repositories/{repo_id}/chat/history", tags=["chat"])
def get_chat_history(repo_id: str, db: Session = Depends(get_db)):
    """Fetch previous chat messages for a repository."""
    try:
        repo_uuid = uuid.UUID(repo_id)
        messages = db.query(DBChatMessage).filter(
            DBChatMessage.repo_id == repo_uuid
        ).order_by(DBChatMessage.created_at.asc()).all()
        return [
            {
                "id": str(msg.id),
                "role": msg.role,
                "content": msg.content,
                "sources": msg.sources
            } for msg in messages
        ]
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", tags=["chat"])
def chat_with_repo(
    request: ChatRequest,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    x_session_token: str | None = Header(None, alias="X-Session-Token"),
):
    """
    Query the codebase using AI RAG (Streaming).
    Supports: BYOK (X-API-Key header) or Trial (X-Session-Token header).
    """
    logger.info(f"Received chat request for repo {request.repo_id}")

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    api_key = x_api_key  # User's own Gemini key (BYOK)

    # If no BYOK key, check trial quota
    if not api_key:
        if not x_session_token:
            # Create a new trial session
            session, _ = trial_service.get_or_create_session(db, None)
            x_session_token = session.session_token

        allowed, remaining = trial_service.check_chat_quota(db, x_session_token)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Free trial limit reached (15 messages). Please add your own Gemini API key to continue.",
                    "trial_exhausted": True,
                    "session_token": x_session_token,
                }
            )
        # Consume 1 chat message from trial
        trial_service.use_chat_quota(db, x_session_token)

    try:
        repo_uuid = uuid.UUID(request.repo_id)

        # Fetch last 10 messages from DB for context
        recent_messages = db.query(DBChatMessage).filter(
            DBChatMessage.repo_id == repo_uuid
        ).order_by(DBChatMessage.created_at.desc()).limit(10).all()
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in reversed(recent_messages)]

        # Save user message
        user_msg = DBChatMessage(repo_id=repo_uuid, role="user", content=request.message)
        db.add(user_msg)
        db.commit()

        # Stream response
        response = StreamingResponse(
            rag_service.stream_question(request.repo_id, request.message, history_dicts, api_key=api_key),
            media_type="application/x-ndjson",
        )
        # Send back session token so frontend can persist it
        if x_session_token and not api_key:
            response.headers["X-Session-Token"] = x_session_token
        return response

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trial/status", tags=["trial"])
def get_trial_status(
    db: Session = Depends(get_db),
    x_session_token: str | None = Header(None, alias="X-Session-Token"),
):
    """Get trial usage info for the current session."""
    if not x_session_token:
        # Create a new session and return it
        session, _ = trial_service.get_or_create_session(db, None)
        usage = trial_service.get_usage_info(db, session.session_token)
        usage["session_token"] = session.session_token
        return usage

    usage = trial_service.get_usage_info(db, x_session_token)
    usage["session_token"] = x_session_token
    return usage
