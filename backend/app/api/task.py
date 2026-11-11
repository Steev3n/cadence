from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth import CurrentUserId
from app.db import get_db
from app.schemas.task import TaskCreate, TaskRead
from app.services.task import create_task, list_tasks

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskRead])
def get_tasks(
    user_id: CurrentUserId,
    db: Annotated[Session, Depends(get_db)],
):
    return list_tasks(db=db, user_id=user_id)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def post_task(
    data: TaskCreate,
    user_id: CurrentUserId,
    db: Annotated[Session, Depends(get_db)],
):
    return create_task(db=db, user_id=user_id, data=data)
