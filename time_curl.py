import time
import requests

url = "http://localhost:8001/api/chat"
repo_id = "c60957c4-6fdc-4f52-8cbf-65c304751980"
questions = [
    "Hello! How are you?",
    "Where are the API routes defined?",
    "Explain the RAG implementation and how it queries Qdrant."
]

for q in questions:
    start = time.time()
    res = requests.post(url, json={"repo_id": repo_id, "message": q}, stream=True)
    first_token_time = None
    for line in res.iter_lines():
        if line and first_token_time is None:
            first_token_time = time.time() - start
    end = time.time()
    
    print(f"Q: {q}")
    print(f"  TTFT: {first_token_time:.2f}s | Total: {end - start:.2f}s")
