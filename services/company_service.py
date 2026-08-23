from chains.contact_chains import match_company_chain
from services.search_service import search_company
from core.callbacks import TokenTrackerHandler

def match_company(target_company: str, group_id: str, group_name: str, user_id: str) -> dict:
    tracker = TokenTrackerHandler(
        log_type="group_line",
        step_name=" match_company_name", 
        group_id=group_id, 
        group_name=group_name,
        user_id=user_id
    )

    company_list = search_company(target_company)
    if not company_list:
        return {"is_company_matched": False, "company_name_th": None, "company_name_en": None}
    
    response = match_company_chain.invoke({
        "target_company": target_company, 
        "company_list": company_list
    }, config={"callbacks": [tracker]})
    
    result = response.model_dump()
    is_company_matched = True if  result['company_name_th'] or result['company_name_en'] else False
    
    return {"is_company_matched": is_company_matched, "company_name_th": result['company_name_th'], "company_name_en": result['company_name_en'] }