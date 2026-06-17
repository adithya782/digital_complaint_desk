from celery import Celery
from train_model import train_model_from_database
from celery.schedules import crontab

celery_app = Celery('tasks', broker = 'redis://redis:6379/0', backend='redis://redis:6379/1')

@celery_app.task
def ai_training():
    print("🤖 Celery Worker: Starting heavy AI training background process...")
    success = train_model_from_database()
    print(f"🤖 Celery Worker: Training completed with status: {success}")
    return success

celery_app.conf.beat_schedule = {
    'train-model-every-10-minutes': {
        'task': 'tasks.ai_training',
        'schedule': crontab(minute='*/10'), 
    },
}