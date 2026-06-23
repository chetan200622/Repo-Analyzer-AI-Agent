import logging
from typing import List, Dict, Any
from app.infrastructure.qdrant import qdrant_service
from app.services.embedding_service import embedding_service
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

logger = logging.getLogger(__name__)

class RetrievalService:
    def search_code_chunks(self, repo_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Embeds the query and searches Qdrant for the most relevant code chunks for a specific repo.
        """
        try:
            # 1. Embed the user query
            query_vector = embedding_service.generate_embeddings([query])[0]

            # 2. Query Qdrant with a filter on repo_id
            search_response = qdrant_service.client.query_points(
                collection_name="code_chunks",
                query=query_vector,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="repo_id",
                            match=MatchValue(value=repo_id)
                        )
                    ]
                ),
                limit=limit,
                score_threshold=0.62
            )

            # 3. Format the results
            results = []
            for hit in search_response.points:
                results.append({
                    "score": hit.score,
                    "file_path": hit.payload.get("file_path"),
                    "start_line": hit.payload.get("start_line"),
                    "end_line": hit.payload.get("end_line"),
                    "symbol_name": hit.payload.get("symbol_name"),
                    "code": hit.payload.get("code")
                })
                
            return results
        except Exception as e:
            logger.error(f"Error retrieving code chunks: {e}")
            return []

retrieval_service = RetrievalService()
