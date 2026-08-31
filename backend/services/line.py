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

from typing import Any


def get_group_messages():
    group_messages = defaultdict(list)

    query = """
      SELECT line_group_id, message_type, text_content, created_at, is_read
      FROM line_messages 
      WHERE line_group_id IS NOT NULL and is_read = false
      ORDER BY line_group_id, created_at ASC
      FOR UPDATE SKIP LOCKED;;
    """

    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            
    except Exception as e:
        raise DatabaseError() from e

    for row in rows:
        line_group_id, message_type, text_content, _, is_read = row
        if is_read:  continue

        if message_type and message_type.strip() == "text" and text_content:
            group_messages[line_group_id].append(text_content)

    return group_messages

def update_read_group_messages(group_id: str = None, conn: Any = None):
    if not group_id:
        raise BadRequestError(message="group_id is required")
    if not conn:
        raise BadRequestError(message="no connection provided")
    
    query = """
      UPDATE line_messages 
      SET is_read = true 
      WHERE line_group_id = %(group_id)s AND is_read = false;
    """

    try:
        with conn.cursor() as cursor:
            cursor.execute(query, {"group_id": group_id})
            
    except NotFoundError as e:
        raise
    
    except BadRequestError as e:
        raise
    
    except Exception as e:
        raise DatabaseError() from e



def get_line_groups() -> LineGroupList:
    query = """
      select line_group_id, display_name, company_th, company_en, is_company_matched, updated_at 
      from line_groups
    """
    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(query)
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
        
        with pg_db.get_connection() as conn:
          try:
          
            summary = summarize_line_group_messages(
                "\n".join(messages), group_id, group_name, user_id
            )
            contact_list = summary.get("contact_list")
            
            if not contact_list:
                update_read_group_messages(group_id=group_id, conn=conn)
                continue
            
            print(f"\nSummary group {group_name}\n")
            for i in contact_list:  
                for key  in i:
                    print(f"{key}: {i.get(key, "<ไม่มีข้อมูล>")}")
            
            
            if not group_info.is_company_matched:
                update_company_pg(
                    Company(
                        group_id=group_id,
                        company_th=summary.get("company_th"),
                        company_en=summary.get("company_en"),
                    ),
                    conn=conn,
                )
                print("Company information updated\n")
            
            for contact in contact_list:
                create_pending_coordinator(
                    Coordinator(group_id=group_id, status="pending", **contact),
                    user_id=user_id,
                    conn=conn,
                )
                
            update_read_group_messages(group_id=group_id, conn=conn)
            conn.commit()
            print(f"Ectract Information for group: {group_name} successfully\n")

          except Exception:
            print(f"Error occured for group: {group_name}, Roll back successfully\n")
            conn.rollback()
            if group_name not in error_groups:
                error_groups.append(group_name)
            continue

    return error_groups