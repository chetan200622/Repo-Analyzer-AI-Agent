from app.infrastructure.database import SessionLocal
from app.domain.models import Repository
from app.services.retrieval_service import retrieval_service

def test_scores():
    session = SessionLocal()
    repo = session.query(Repository).filter(Repository.status == "READY").first()
    if not repo:
        print("No ready repo")
        return
        
    query1 = "Explain the main function or entry point of this codebase."
    query2 = "explain me"
    query3 = "hi"
    
    print("Query 1:", query1)
    res1 = retrieval_service.search_code_chunks(str(repo.id), query1)
    for r in res1: print(r['score'])
    
    print("\nQuery 2:", query2)
    res2 = retrieval_service.search_code_chunks(str(repo.id), query2)
    for r in res2: print(r['score'])
    
    print("\nQuery 3:", query3)
    res3 = retrieval_service.search_code_chunks(str(repo.id), query3)
    for r in res3: print(r['score'])

if __name__ == "__main__":
    test_scores()
