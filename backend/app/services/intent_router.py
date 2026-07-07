from enum import Enum
import logging
from langchain_ollama import OllamaLLM

logger = logging.getLogger(__name__)

class ChatIntent(str, Enum):
    GENERAL = "GENERAL"
    ARCHITECTURE = "ARCHITECTURE"
    CODE_SEARCH = "CODE_SEARCH"

class IntentRouter:
    def __init__(self, llm=None):
        # We can reuse the existing LLM instance
        self.llm = llm or OllamaLLM(model="qwen2.5-coder")

    def route_query(self, query: str) -> ChatIntent:
        """
        Classifies a user query into one of three intents to determine how to process it.
        """
        prompt = f"""You are an Intent Classifier for an AI Codebase Assistant. 
Analyze the following user message and classify it into EXACTLY ONE of these categories:

1. GENERAL: The user is greeting you, saying thank you, making small talk, or asking a general question that does not require any knowledge about the codebase.
2. ARCHITECTURE: The user is asking for a high-level summary of the repository, the tech stack, what the project is about, or what libraries/dependencies it uses.
3. CODE_SEARCH: The user is asking a specific technical question about the code, how a feature is implemented, where a file is, or asking to debug something.

User Message: "{query}"

Output ONLY the category name (GENERAL, ARCHITECTURE, or CODE_SEARCH). Do not output anything else.
"""
        try:
            # We want a fast response, so we could theoretically use a smaller model if configured, 
            # but for now we use the main one.
            response_obj = self.llm.invoke(prompt)
            # Handle both string responses and objects with .content (just in case)
            raw_result = getattr(response_obj, "content", str(response_obj)).strip().upper()
            
            # Clean up the output in case the LLM was chatty
            if "GENERAL" in raw_result:
                return ChatIntent.GENERAL
            elif "ARCHITECTURE" in raw_result:
                return ChatIntent.ARCHITECTURE
            elif "CODE_SEARCH" in raw_result:
                return ChatIntent.CODE_SEARCH
            
            # Fallback if the LLM output something weird
            logger.warning(f"Intent Router received unexpected output: {raw_result}, defaulting to CODE_SEARCH")
            return ChatIntent.CODE_SEARCH
            
        except Exception as e:
            logger.error(f"Intent classification failed: {str(e)}. Defaulting to CODE_SEARCH.")
            return ChatIntent.CODE_SEARCH

# Create a singleton instance
intent_router = IntentRouter()
