import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    repo_id: str
    message: str

class ChatSource(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    symbol_name: str | None = None
    code: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource]

@router.post("/chat", tags=["chat"])
async def chat_with_repo(request: ChatRequest):
    """
    Query the codebase using AI RAG (Streaming).
    """
    logger.info(f"Received chat stream request for repo {request.repo_id}")
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    try:
        return StreamingResponse(
            rag_service.stream_question(request.repo_id, request.message),
            media_type="application/x-ndjson"
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
