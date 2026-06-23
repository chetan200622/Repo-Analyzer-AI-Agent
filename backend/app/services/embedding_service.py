import logging
from typing import List
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# We use BAAI/bge-small-en-v1.5 as per the PRD. It's fast, efficient, and scores highly.
MODEL_NAME = "BAAI/bge-small-en-v1.5"

class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance.model = None
        return cls._instance

    def _load_model(self):
        if self.model is None:
            logger.info(f"Loading embedding model {MODEL_NAME}...")
            # This downloads the model on the first run if not cached.
            self.model = SentenceTransformer(MODEL_NAME)
            logger.info(f"Embedding model loaded successfully.")

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of strings.
        Returns a list of vectors (list of floats).
        """
        if not texts:
            return []
            
        self._load_model()
        
        try:
            # normalize_embeddings=True is highly recommended for BGE models to use cosine similarity effectively.
            embeddings = self.model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise e

embedding_service = EmbeddingService()
