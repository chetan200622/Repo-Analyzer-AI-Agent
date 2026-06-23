import os
import logging
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

logger = logging.getLogger(__name__)

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)

class QdrantService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(QdrantService, cls).__new__(cls)
            cls._instance.client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
            cls._instance._initialize_collections()
        return cls._instance

    def _initialize_collections(self):
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]

            # code_chunks collection
            if "code_chunks" not in collection_names:
                logger.info("Creating 'code_chunks' collection in Qdrant.")
                self.client.create_collection(
                    collection_name="code_chunks",
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE), # 384 is size for BAAI/bge-small-en-v1.5
                )
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collections: {e}")

    def upsert_chunks(self, collection_name: str, points: list):
        """
        points is a list of qdrant_client.http.models.PointStruct
        """
        try:
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
        except Exception as e:
            logger.error(f"Failed to upsert chunks into {collection_name}: {e}")
            raise e

qdrant_service = QdrantService()
