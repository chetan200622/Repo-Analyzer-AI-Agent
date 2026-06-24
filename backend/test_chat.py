import sys
import os
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Ensure we're in the right directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.domain.models import Repository
from app.infrastructure.database import SessionLocal
from app.services.rag_service import rag_service

def test_chat():
    print("Testing Chatbot RAG Service...")
    
    # 1. Connect to DB and find a READY repo
    session = SessionLocal()
    
    repo = session.query(Repository).filter(Repository.status == "READY").first()
    if not repo:
        print("❌ No READY repositories found in the database. Please analyze a repository first.")
        session.close()
        return
        
    print(f"✅ Found repository: {repo.name} (ID: {repo.id})")
    print(f"Languages: {repo.language_stats}")
    print("-" * 50)
    
    # 2. Test a question
    question = "Explain the main function or entry point of this codebase."
    print(f"User Question: {question}")
    print("-" * 50)
    
    print("Agent Response (Streaming):")
    
    try:
        # stream_question is a generator
        for chunk in rag_service.stream_question(str(repo.id), question):
            print(chunk, end="", flush=True)
            
        print("\n" + "-" * 50)
        print("✅ Chat test completed successfully!")
    except Exception as e:
        print(f"\n❌ Error during chat test: {e}")
        
    session.close()

if __name__ == "__main__":
    test_chat()
