# Gemini AI client — supports BYOK and platform trial key with streaming
import logging
import os
from typing import Generator, Optional

import google.generativeai as genai

logger = logging.getLogger(__name__)

# Platform's own Gemini key for trial users (from env var, never exposed to frontend)
PLATFORM_GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


class GeminiClient:
    """Wrapper around Google's Gemini API supporting per-request API keys."""

    def invoke(self, prompt: str, api_key: Optional[str] = None) -> str:
        """Non-streaming Gemini call. Returns full response text."""
        key = api_key or PLATFORM_GEMINI_KEY
        if not key:
            raise ValueError("No Gemini API key provided and no platform key configured")

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
            logger.error(f"Gemini invoke error: {e}")
            raise

    def stream(self, prompt: str, api_key: Optional[str] = None) -> Generator[str, None, None]:
        """Streaming Gemini call. Yields text chunks."""
        key = api_key or PLATFORM_GEMINI_KEY
        if not key:
            raise ValueError("No Gemini API key provided and no platform key configured")

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
        except Exception as e:
            logger.error(f"Gemini stream error: {e}")
            raise


# Singleton
gemini_client = GeminiClient()
