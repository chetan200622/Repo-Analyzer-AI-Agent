.PHONY: setup backend-dev frontend-dev worker-dev

setup:
	cp .env.example .env
	cd backend && python -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install

backend-dev:
	cd backend && . venv/bin/activate && uvicorn app.main:app --reload --port 8000

worker-dev:
	cd backend && . venv/bin/activate && rq worker

frontend-dev:
	cd frontend && npm run dev
