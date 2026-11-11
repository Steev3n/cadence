from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import CurrentUserId
from app.db import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.task import create_task, list_tasks

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def post_task(
    data: TaskCreate,
    user_id: CurrentUserId,
    db: Annotated[Session, Depends(get_db)],
):
    return create_task(db=db, user_id=user_id, data=data)

@router.get("", response_model=list[TaskRead])
def get_tasks(
    user_id: CurrentUserId,
    db: Annotated[Session, Depends(get_db)],
):
    return list_tasks(db=db, user_id=user_id)

@router.patch("/{task_id}", response_model=TaskRead, status_code=status.HTTP_200_OK)
def patch_task(
    task_id: UUID,
    data: TaskUpdate,
    user_id: CurrentUserId,
    db: Annotated[Session, Depends(get_db)],
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    user_id: CurrentUserId,
    db: Annotated[Session, Depends(get_db)],
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
