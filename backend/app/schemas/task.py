from pydantic import BaseModel, ConfigDict, Field, field_validator, AwareDatetime
from uuid import UUID
from app.models.task import TaskStatus, TaskPriority

class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=255)
    priority: TaskPriority = TaskPriority.MEDIUM
    due_at: AwareDatetime | None = None
    estimated_minutes: int | None = Field(default=None, gt=0)
    remaining_minutes: int | None = Field(default=None, ge=0)

    @field_validator("title", mode="before")
    @classmethod
    def trim_title(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Title must be a string")
        return v.strip()

class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    due_at: AwareDatetime | None = None
    estimated_minutes: int | None = Field(default=None, gt=0)
    remaining_minutes: int | None = Field(default=None, ge=0)
    created_at: AwareDatetime
    updated_at: AwareDatetime



