from celery import Celery
from train_model import train_model_from_database

celery_app = Celery('tasks', broker = 'redis://localhost:6379/0', backend='redis://localhost:6379/1')

@celery_app.task
def ai_training():
    print("🤖 Celery Worker: Starting heavy AI training background process...")
    success = train_model_from_database()
    print(f"🤖 Celery Worker: Training completed with status: {success}")
    return success