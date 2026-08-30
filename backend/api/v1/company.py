from fastapi import APIRouter, Depends

from api.deps import current_user
from schemas.company import Company, CompanyList, CompanyInput
from schemas.user import AuthUser
from services.company import get_companies, sync_company

router = APIRouter(prefix="/companies", tags=["company"])


@router.get("", response_model=CompanyList)
def get_companies_api(user: AuthUser = Depends(current_user)):
    return get_companies()

@router.post("/{group_id}", response_model=dict)
def create_company_api(payload: CompanyInput, group_id: str, user: AuthUser = Depends(current_user)):
    company_data = Company(group_id=group_id, **payload.model_dump())
    sync_company(company_data, on_create=True)
    return {"status": "success"}

@router.put("/{group_id}", response_model=dict)
def update_company_api(payload: CompanyInput, group_id: str, user: AuthUser = Depends(current_user)):
    company_data = Company(group_id=group_id, **payload.model_dump())
    sync_company(company_data, on_create=False)
    return {"status": "success"}

