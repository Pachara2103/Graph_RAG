from pydantic import ValidationError
from collections import defaultdict
from chains.contact_chains import extract_contact_chain


from core.db import pg_db
from core.exceptions import DatabaseError, NotFoundError, BadRequestError
from core.callbacks import TokenTrackerHandler

from schemas.contact import  ContactList
from schemas.line import LineGroupList, LineGroup
from schemas.company import Company
from schemas.coordinator import Coordinator, CoordinatorList

from services.company import update_company_pg
from services.coordinator import create_pending_coordinator


GET_GROUP_MESSAGES = """
SELECT 
    line_group_id,
    message_type,
    text_content,
    created_at,
    is_read
FROM line_messages 
WHERE line_group_id IS NOT NULL
ORDER BY line_group_id, created_at ASC
limit 20;
"""

def get_group_messages():
    group_messages = defaultdict(list)

    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(GET_GROUP_MESSAGES)
            rows = cursor.fetchall()
            
    except Exception as e:
        raise DatabaseError() from e

    for row in rows:
        line_group_id, message_type, text_content, _, is_read = row
        if is_read:
            continue

        if message_type and message_type.strip() == "text" and text_content:
            group_messages[line_group_id].append(text_content)

    return group_messages



get_line_groups_QUERY = """
select line_group_id, display_name, company_th, company_en, is_company_matched, updated_at from line_groups
"""
def get_line_groups() -> LineGroupList:
    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(get_line_groups_QUERY)
            rows = cursor.fetchall()
            
    except Exception as e:
        raise DatabaseError() from e

    line_groups = [
        LineGroup(
            id=group_id,
            display_name=display_name,
            company_th=company_th,
            company_en=company_en,
            is_company_matched=is_company_matched,
            updated_at=updated_at,
        )
        for ( group_id, display_name, company_th, company_en, is_company_matched, updated_at,) in rows
    ]

    return LineGroupList(groups=line_groups)


def summarize_line_group_messages(chat_history: str, group_id: str, group_name: str, user_id: str) -> dict:
    tracker = TokenTrackerHandler(
        log_type="line_group",
        step_name="summarize_line_group_messages", 
        group_id=group_id, 
        group_name=group_name, 
        user_id=user_id
    )
    try:
      result = extract_contact_chain.invoke({"chat_history": chat_history}, config={"callbacks": [tracker]})
      return result.model_dump()

    except Exception as e:
        raise e


def update_information(user_id: str = "bot"):
    group_messages = get_group_messages()
    line_groups = get_line_groups()

    if not line_groups.groups:
        raise NotFoundError(message="ไม่พบข้อมูลกลุ่ม Line")

    line_groups_map = {group.id: group for group in line_groups.groups}
    error_groups = []

    for group_id, messages in group_messages.items():
        group_info = line_groups_map.get(group_id)

        if not group_info or not messages:
            continue

        group_name = group_info.display_name or "<ไม่มีชื่อกลุ่ม>"

        try:
            summary = summarize_line_group_messages(
                "\n".join(messages), group_id, group_name, user_id
            )
            contact_list = summary.get("contact_list")

            if not contact_list:
                continue
            
            print("...Updating information for group:", group_name)
            print("Contact list: ", contact_list)

            if not group_info.is_company_matched:
                update_company_pg(
                    Company(
                        group_id=group_id,
                        name_th=summary.get("company_th"),
                        name_en=summary.get("company_en"),
                    )
                )
                print("Company information updated")

            for contact in contact_list:
                create_pending_coordinator(
                    Coordinator(group_id=group_id, status="pending", **contact),
                    user_id,
                )
            print("Success")
            

        except Exception:
            if group_name not in error_groups:
                error_groups.append(group_name)
            continue

    return error_groups