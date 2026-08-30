from schemas.api import ApiBaseModel


class CompanyInput(ApiBaseModel):
    company_th: str | None = None
    company_en: str | None = None
    
class Company(ApiBaseModel):
    group_id: str
    company_th: str | None = None
    company_en: str | None = None
    aliases: list = []
    
class CompanyList(ApiBaseModel):
    companies: list[Company]