from fastapi import APIRouter, Depends

from api.deps import current_user
from schemas.coordinator import  ApprovalResponse, CoordinatorList, Coordinator
from schemas.user import AuthUser
from services.coordinator import get_coordinators, sync_approve, decline, update_coordinator_pg

router = APIRouter(prefix="/coordinators", tags=["coordinator"])


@router.get("", response_model=CoordinatorList)
def get_coordinators_api(user: AuthUser = Depends(current_user)):
    return get_coordinators()

@router.post("/{id}/approve")
def process_coordinator_approval_api(id: int,user: AuthUser = Depends(current_user)):
    sync_approve(id, user.id)
    return {"status": "success"}

@router.post("/{id}/decline")
def process_coordinator_decline_api(id: int,user: AuthUser = Depends(current_user)):
    decline(id, user.id)
    return {"status": "success"}

@router.put("/{id}")
def update_coordinator_api(payload: Coordinator,user: AuthUser = Depends(current_user)):
    update_coordinator_pg(payload, user.id)
    return {"status": "success"}