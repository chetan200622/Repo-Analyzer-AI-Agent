# LLM client — supports Gemini API, BYOK, and Ollama local fallback
import logging
import os
import json
from typing import Generator, Optional

import google.generativeai as genai

logger = logging.getLogger(__name__)

# Platform's own Gemini key for trial users (from env var, never exposed to frontend)
PLATFORM_GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Ollama local model settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("LLM_MODEL", "qwen2.5-coder")

# LLM provider: "gemini" (default), "ollama" (local), or "auto" (gemini with ollama fallback)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto")


def _ollama_available() -> bool:
    """Check if Ollama is running locally."""
    try:
        import httpx
        resp = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2.0)
        return resp.status_code == 200
    except Exception:
        return False


def _ollama_invoke(prompt: str) -> str:
    """Call Ollama's generate API (non-streaming)."""
    import httpx
    resp = httpx.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=120.0,
    )
    resp.raise_for_status()
    return resp.json().get("response", "")


def _ollama_stream(prompt: str) -> Generator[str, None, None]:
    """Call Ollama's generate API (streaming)."""
    import httpx
    with httpx.stream(
        "POST",
        f"{OLLAMA_BASE_URL}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True},
        timeout=120.0,
    ) as resp:
        for line in resp.iter_lines():
            if line:
                try:
                    data = json.loads(line)
                    token = data.get("response", "")
                    if token:
                        yield token
                except json.JSONDecodeError:
                    continue


class GeminiClient:
    """Wrapper around Google's Gemini API with automatic Ollama fallback."""

    def invoke(self, prompt: str, api_key: Optional[str] = None) -> str:
        """Non-streaming LLM call. Returns full response text."""
        # If explicitly set to ollama, skip Gemini entirely
        if LLM_PROVIDER == "ollama":
            logger.info("Using Ollama (%s) for LLM invoke", OLLAMA_MODEL)
            return _ollama_invoke(prompt)

        key = api_key or PLATFORM_GEMINI_KEY
        if key:
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel(GEMINI_MODEL)
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.15,
                        max_output_tokens=4096,
                    ),
                )
                return response.text
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "quota" in error_str.lower():
                    logger.warning("Gemini quota exceeded, falling back to Ollama")
                    if _ollama_available():
                        return _ollama_invoke(prompt)
                logger.error("Gemini invoke error: %s", e)
                raise

        # No Gemini key — try Ollama
        if _ollama_available():
            logger.info("No Gemini key, using Ollama (%s)", OLLAMA_MODEL)
            return _ollama_invoke(prompt)

        raise ValueError("No Gemini API key and Ollama is not running")

    def stream(self, prompt: str, api_key: Optional[str] = None) -> Generator[str, None, None]:
        """Streaming LLM call. Yields text chunks."""
        # If explicitly set to ollama, skip Gemini entirely
        if LLM_PROVIDER == "ollama":
            logger.info("Using Ollama (%s) for LLM stream", OLLAMA_MODEL)
            yield from _ollama_stream(prompt)
            return

        key = api_key or PLATFORM_GEMINI_KEY
        if key:
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel(GEMINI_MODEL)
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.15,
                        max_output_tokens=4096,
                    ),
                    stream=True,
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "quota" in error_str.lower():
                    logger.warning("Gemini quota exceeded, falling back to Ollama for streaming")
                    if _ollama_available():
                        yield from _ollama_stream(prompt)
                        return
                logger.error("Gemini stream error: %s", e)
                raise

        # No Gemini key — try Ollama
        if _ollama_available():
            logger.info("No Gemini key, using Ollama (%s) for streaming", OLLAMA_MODEL)
            yield from _ollama_stream(prompt)
            return

        raise ValueError("No Gemini API key and Ollama is not running")


# Singleton
gemini_client = GeminiClient()
