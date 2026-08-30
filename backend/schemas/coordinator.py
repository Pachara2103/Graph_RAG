from enum import Enum
from typing import Literal
from datetime import datetime
from schemas.api import ApiBaseModel

class ActionEnum(str, Enum):
    APPROVED = "approve"
    DECLINED = "decline"
    
class Coordinator(ApiBaseModel):
    id: int | None = None
    group_id: str | None = None
    name_th: str | None = None
    name_en: str | None = None
    nickname: str | None = None
    job_title: str | None = None
    phone: str | None = None
    email: str | None = None
    relevant: str | None = None
    status: Literal["approved", "declined", "pending", "failed"] = "pending"
    updated_at: datetime = datetime.now().isoformat()
    
class CoordinatorList(ApiBaseModel):
    coordinators: list[Coordinator]

class ApprovalRequest(ApiBaseModel):
    """One review decision, as the console sends it."""
    coordinator_id: int
    action: Literal["approve", "decline"]


class ApprovalResponse(ApiBaseModel):
    status: str = "success"
    # The Neo4j node that was created. Null on decline, which writes nothing.
    coordinator: dict | None = None
