# Intent classification for codebase chat queries
from enum import Enum
import logging
import re

logger = logging.getLogger(__name__)


class ChatIntent(str, Enum):
    GENERAL = "GENERAL"
    UNDERSTANDING = "UNDERSTANDING"
    ARCHITECTURE = "ARCHITECTURE"
    CODE_EXPLANATION = "CODE_EXPLANATION"
    BUG_FINDING = "BUG_FINDING"
    NAVIGATION = "NAVIGATION"
    LEARNING = "LEARNING"
    REFACTORING = "REFACTORING"


# Fast keyword-based classification (no LLM call needed)
INTENT_PATTERNS = {
    ChatIntent.GENERAL: [
        r"\b(hi|hello|hey|thanks|thank you|bye|good morning|good evening|how are you)\b",
    ],
    ChatIntent.UNDERSTANDING: [
        r"\b(what does this (project|repo|repository|app|application) do)\b",
        r"\b(what is this|purpose of this|overview|about this)\b",
        r"\b(explain the project|summarize|summary)\b",
    ],
    ChatIntent.ARCHITECTURE: [
        r"\b(architecture|tech stack|stack|design pattern|folder structure|structure)\b",
        r"\b(how is.*(organized|structured|designed|built))\b",
        r"\b(backend|frontend|database|api).*(architecture|design|layer)\b",
        r"\b(system design|high level|overview of)\b",
    ],
    ChatIntent.CODE_EXPLANATION: [
        r"\b(what does|explain|how does|how is|walk me through)\b.*\b(function|method|class|file|module|component|service)\b",
        r"\b(explain|what is|what does)\b.*\.(py|ts|tsx|js|jsx|go|rs)\b",
        r"\b(what does .+ do)\b",
        r"\b(explain the code|code explanation|walk through)\b",
    ],
    ChatIntent.BUG_FINDING: [
        r"\b(bug|error|issue|problem|fail|crash|broken|wrong|fix|debug)\b",
        r"\b(why is|why does|why isn't|not working|doesn't work)\b",
        r"\b(troubleshoot|diagnose|investigate)\b",
    ],
    ChatIntent.NAVIGATION: [
        r"\b(where is|find|locate|which file|show me|path to)\b",
        r"\b(implemented|defined|declared|used|called)\b",
        r"\b(where.*(jwt|auth|login|signup|database|config|middleware|route))\b",
    ],
    ChatIntent.LEARNING: [
        r"\b(teach me|how to|learn|understand|guide|tutorial|explain how)\b",
        r"\b(how.*(works|flow|process|pipeline))\b",
        r"\b(step by step|walkthrough)\b",
    ],
    ChatIntent.REFACTORING: [
        r"\b(improve|refactor|optimize|better|clean up|simplify|restructure)\b",
        r"\b(how can.*(improve|better|optimize|refactor))\b",
        r"\b(code smell|technical debt|best practice)\b",
        r"\b(add|implement|create|build).*(feature|endpoint|module|service)\b",
    ],
}


class IntentRouter:
    def route_query(self, query: str) -> ChatIntent:
        """
        Fast keyword-based intent classification.
        No LLM call needed — saves latency on every chat message.
        """
        query_lower = query.lower().strip()

        # Score each intent by number of pattern matches
        scores = {}
        for intent, patterns in INTENT_PATTERNS.items():
            score = 0
            for pattern in patterns:
                try:
                    if re.search(pattern, query_lower):
                        score += 1
                except re.error:
                    pass
            if score > 0:
                scores[intent] = score

        if scores:
            best_intent = max(scores, key=scores.get)
            logger.info(f"Intent classified as {best_intent.value} for query: {query[:80]}")
            return best_intent

        # Default to CODE_EXPLANATION for technical queries
        logger.info(f"No intent match, defaulting to CODE_EXPLANATION for: {query[:80]}")
        return ChatIntent.CODE_EXPLANATION


# Singleton instance
intent_router = IntentRouter()
