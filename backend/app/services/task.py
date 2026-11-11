from uuid import UUID
from sqlalchemy.orm import Session
from app.models.task import Task
from app.schemas.task import TaskCreate

def create_task(
    db: Session,
    user_id: UUID,
    data: TaskCreate,
) -> Task:
    task = Task(
        user_id=user_id,
        **data.model_dump(),
    )

    db.add(task)

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return task

def list_tasks(
    db: Session,
    user_id: UUID,
) -> list[Task]:
    return (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .order_by(Task.created_at.desc(), Task.id.desc())
        .all()
    )
