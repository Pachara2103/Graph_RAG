from core.db import pg_db
from collections import defaultdict
from chains.contact_chains import extract_contact_chain
from schemas.contact import ContactInfo
from services.company_service import match_company
from core.callbacks import TokenTrackerHandler

GET_GROUP_MESSAGES_QUERY = """
SELECT 
    m.line_group_id,
    g.display_name,
    m.message_type,
    m.text_content,
    m.created_at,
    m.is_read
FROM line_messages m
INNER JOIN line_groups g ON m.line_group_id = g.line_group_id
WHERE m.line_group_id IS NOT NULL
ORDER BY m.line_group_id, m.created_at ASC;
"""

def get_group_messages():
    group_chat = defaultdict(list)
    group_name = defaultdict(str)
    
    try:
      with pg_db.get_cursor() as cursor:
        cursor.execute(GET_GROUP_MESSAGES_QUERY)
        rows = cursor.fetchall()

        for row in rows:
            line_group_id, display_name, message_type, text_content, _, is_read = row
            if is_read:
                continue
                
            if message_type and message_type.strip() == "text" and text_content:
                group_chat[line_group_id].append(text_content)
                group_name[line_group_id] = display_name
                
        print(f"\n[Log] Get group messages successfully!\n")
        
    except Exception as e:
        print(f"\n[Error] Failed to get group messages:\n{e}\n")
                    
    return group_chat, group_name


def summary_group_line_chat(chat_history: str, group_id: str, group_name: str, user_id: str) -> ContactInfo:
    tracker = TokenTrackerHandler(
        log_type="group_line",
        step_name="summary_group_line_chat", 
        group_id=group_id, 
        group_name=group_name, 
        user_id=user_id
    )
    result = extract_contact_chain.invoke({"chat_history": chat_history}, config={"callbacks": [tracker]})
    return result.model_dump()


def get_pending_approvals(user_id: str="0") -> list[dict]:
    group_chat, group_name_dict = get_group_messages()
    pending_approvals = []
    
    for group_id, messages in group_chat.items():
        group_name = group_name_dict.get(group_id, None)
        if not messages:
            continue
        summary = summary_group_line_chat("\n".join(messages), group_id, group_name, user_id)
        if summary and all(value is None for value in summary.values()):
            continue
        
        company_name_en = summary.get('company_name_en')
        company_name_th = summary.get('company_name_th')
        
        if company_name_en or company_name_th:
            summary['line_group_name'] = group_name
            
            search_term = ", ".join(filter(None, [company_name_en, company_name_th]))
            match_result = match_company(search_term, group_id, group_name, user_id)
            
            summary['is_company_matched'] = match_result.get('is_company_matched', False)
            
            if summary['is_company_matched']:
                summary['company_name_th'] = match_result.get('company_name_th')
                summary['company_name_en'] = match_result.get('company_name_en')
            
            pending_approvals.append(summary)
            
    return pending_approvals