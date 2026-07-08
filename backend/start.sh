#!/bin/bash
# Start script for Render.com free tier (Runs both API and Worker in one container)

# Start the RQ background worker
echo "Starting RQ worker..."
python worker.py &

# Start the FastAPI web server
echo "Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT
