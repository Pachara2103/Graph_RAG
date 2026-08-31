from fastapi import APIRouter, Depends

from api.deps import current_user
from schemas.line import LineGroupList, LineUpdateInformationResponse
from schemas.user import AuthUser
from services.line import get_line_groups, update_information

router = APIRouter(prefix="/line", tags=["line"])

@router.get("/groups", response_model=LineGroupList)
def get_line_groups_api(user: AuthUser = Depends(current_user)):
    return get_line_groups()


@router.post("/update-information", response_model=LineUpdateInformationResponse)
def update_information_api(user: AuthUser = Depends(current_user)):
    error_groups  = update_information(user.id)
    return LineUpdateInformationResponse(error_groups=error_groups)