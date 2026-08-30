
from datetime import datetime
from schemas.api import ApiBaseModel
from schemas.coordinator import Coordinator

class LineGroup(ApiBaseModel):
    id: str
    display_name: str
    is_company_matched: bool
    company_th: str | None = None
    company_en: str | None = None
    updated_at: datetime = datetime.now()
    
class LineGroupList(ApiBaseModel):
    groups: list[LineGroup]
    
class LineUpdateInformationResponse(ApiBaseModel):
    error_groups: list = []