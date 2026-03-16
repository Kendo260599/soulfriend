from fastapi import FastAPI

from .learning_service import create_learning_service

app = FastAPI(title="English Foundation API", version="0.1.0")
service = create_learning_service()


@app.get('/api/foundation/lesson')
def get_lesson() -> dict:
    return service.get_lesson_payload()


@app.get('/api/foundation/progress')
def get_progress() -> dict:
    return service.get_progress_payload()
