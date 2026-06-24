import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid

from app.services.rag_service import rag_service
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
    # frontend no longer needs to send history
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
        messages = db.query(DBChatMessage).filter(DBChatMessage.repo_id == repo_uuid).order_by(DBChatMessage.created_at.asc()).all()
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
def chat_with_repo(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Query the codebase using AI RAG (Streaming).
    """
    logger.info(f"Received chat stream request for repo {request.repo_id}")
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    try:
        repo_uuid = uuid.UUID(request.repo_id)
        
        # 1. Fetch last 10 messages from DB
        recent_messages = db.query(DBChatMessage).filter(DBChatMessage.repo_id == repo_uuid).order_by(DBChatMessage.created_at.desc()).limit(10).all()
        # Reverse to chronological order
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in reversed(recent_messages)]
        
        # 2. Save user message
        user_msg = DBChatMessage(repo_id=repo_uuid, role="user", content=request.message)
        db.add(user_msg)
        db.commit()
        
        # 3. Stream response (assistant message saved by rag_service at the end of stream)
        return StreamingResponse(
            rag_service.stream_question(request.repo_id, request.message, history_dicts),
            media_type="application/x-ndjson"
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
