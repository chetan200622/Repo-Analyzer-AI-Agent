import logging
from typing import Dict, Any, List
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from app.services.retrieval_service import retrieval_service

logger = logging.getLogger(__name__)

# Using qwen2.5-coder as it is highly recommended for coding tasks in the PRD
# If it's not downloaded on the host, they will need to `ollama pull qwen2.5-coder`
OLLAMA_MODEL = "qwen2.5-coder"
OLLAMA_BASE_URL = "http://localhost:11434"

PROMPT_TEMPLATE = """You are an elite Principal Software Engineer and AI Architecture Expert analyzing a codebase.
You are tasked with answering a developer's question using ONLY the provided code context.

CRITICAL INSTRUCTIONS:
1. FORMATTING: You MUST format your response using beautifully structured Markdown. Use code blocks (e.g., ```python) for code snippets, bullet points for lists, and bold text for emphasis.
2. ACCURACY: If the answer cannot be determined from the provided context, you MUST say "I don't have enough context in the repository to answer that." Do NOT guess or hallucinate.
3. CITATIONS: When mentioning specific files or lines, refer to them clearly.
4. TONE: Be direct, technical, and highly professional. Do not write fluff.

Code Context:
{context}

User Question: {question}

Answer:"""

class RAGService:
    def __init__(self):
        try:
            self.llm = OllamaLLM(
                model=OLLAMA_MODEL,
                base_url=OLLAMA_BASE_URL,
                temperature=0.1 # Low temperature for factual code answers
            )
        except Exception as e:
            logger.error(f"Failed to initialize OllamaLLM: {e}")
            self.llm = None
            
        self.prompt = PromptTemplate(
            template=PROMPT_TEMPLATE,
            input_variables=["context", "question"]
        )

    def ask_question(self, repo_id: str, query: str) -> Dict[str, Any]:
        """
        Retrieves context, formats prompt, and queries Ollama.
        """
        logger.info(f"RAG query for repo {repo_id}: {query}")
        
        # 1. Retrieve code chunks
        chunks = retrieval_service.search_code_chunks(repo_id, query, limit=5)
        
        if not chunks:
            return {
                "answer": "I couldn't find any relevant code in this repository for your question.",
                "sources": []
            }
            
        # 2. Format context
        context_parts = []
        for i, chunk in enumerate(chunks):
            filepath = chunk.get("file_path", "unknown")
            start = chunk.get("start_line", "?")
            end = chunk.get("end_line", "?")
            symbol = chunk.get("symbol_name", "")
            code = chunk.get("code", "")
            
            header = f"--- Source {i+1}: {filepath} (lines {start}-{end})"
            if symbol:
                header += f" [{symbol}]"
            
            context_parts.append(f"{header}\n{code}\n")
            
        context_str = "\n".join(context_parts)
        
        # 3. Generate Answer
        try:
            formatted_prompt = self.prompt.format(context=context_str, question=query)
            # Invoke the LLM
            # Note: For production, we would use streaming. For MVP, we use standard invoke.
            response = self.llm.invoke(formatted_prompt)
            
            return {
                "answer": response,
                "sources": chunks
            }
        except Exception as e:
            logger.error(f"Error during LLM generation: {e}")
            return {
                "answer": f"Sorry, there was an error communicating with the local AI model. Is Ollama running with `{OLLAMA_MODEL}` pulled? Error: {str(e)}",
                "sources": chunks
            }

    def stream_question(self, repo_id: str, query: str):
        """
        Retrieves context, formats prompt, and streams response from Ollama.
        Yields JSON strings containing either tokens or the final source list.
        """
        import json
        logger.info(f"RAG streaming query for repo {repo_id}: {query}")
        
        # 1. Retrieve code chunks
        chunks = retrieval_service.search_code_chunks(repo_id, query, limit=5)
        
        if not chunks:
            yield json.dumps({"token": "I couldn't find any relevant code in this repository for your question.\n"}) + "\n"
            yield json.dumps({"sources": []}) + "\n"
            return
            
        # 2. Format context
        context_parts = []
        for i, chunk in enumerate(chunks):
            filepath = chunk.get("file_path", "unknown")
            start = chunk.get("start_line", "?")
            end = chunk.get("end_line", "?")
            symbol = chunk.get("symbol_name", "")
            code = chunk.get("code", "")
            
            header = f"--- Source {i+1}: {filepath} (lines {start}-{end})"
            if symbol:
                header += f" [{symbol}]"
            
            context_parts.append(f"{header}\n{code}\n")
            
        context_str = "\n".join(context_parts)
        
        # 3. Generate Answer
        try:
            formatted_prompt = self.prompt.format(context=context_str, question=query)
            
            # Stream the LLM response
            for chunk in self.llm.stream(formatted_prompt):
                yield json.dumps({"token": chunk}) + "\n"
                
            # Yield the sources at the end
            yield json.dumps({"sources": chunks}) + "\n"
            
        except Exception as e:
            logger.error(f"Error during LLM streaming: {e}")
            yield json.dumps({"token": f"\n\nSorry, there was an error communicating with the local AI model. Error: {str(e)}"}) + "\n"
            yield json.dumps({"sources": chunks}) + "\n"

rag_service = RAGService()
