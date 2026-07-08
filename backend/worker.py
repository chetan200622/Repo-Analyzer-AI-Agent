import os
# Fix macOS fork() safety issue that causes gitpython to crash with SIGABRT (-6)
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

import sys
from redis import Redis
from rq import SimpleWorker

# Make sure our backend app is importable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load settings to get Redis URL
from app.core.config import settings

def run_worker():
    redis_conn = Redis.from_url(settings.REDIS_URL, health_check_interval=30)
    worker = SimpleWorker(['analysis', 'default'], connection=redis_conn)
    print("Starting Repo Analyzer RQ worker...")
    worker.work()

if __name__ == '__main__':
    run_worker()
