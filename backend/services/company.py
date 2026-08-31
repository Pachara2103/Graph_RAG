from neo4j.exceptions import  Neo4jError
import logging
from core.db import graph_db, pg_db
from schemas.company import Company, CompanyList
from typing import Any
from fastapi import HTTPException

from core.exceptions import DatabaseError, BadRequestError


GET_MATCHED_COMPANY= """
select line_group_id, company_th , company_en, is_company_matched, aliases 
from line_groups
where is_company_matched = True;
"""

def get_companies() -> CompanyList:
    data = CompanyList(companies=[])
    
    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(GET_MATCHED_COMPANY)
            company_list = cursor.fetchall()
            
        for company in company_list:
            line_group_id, company_th, company_en, is_company_matched, aliases = company
            
            data.companies.append(
                Company(
                    group_id=line_group_id,
                    company_en=company_en,
                    company_th=company_th,
                    aliases=aliases or [] 
                )
            )    
        return data

    except Exception as e:
        raise DatabaseError() from e
        
       
def update_company_pg(payload: Company, conn: Any = None, on_create: bool = False):
    if not payload.group_id:
        raise BadRequestError(message="ไม่เจอกลุ่มไลน์ที่ต้องการอัปเดต") 
    
    if not payload.company_th and not payload.company_en:
        raise BadRequestError(message="ไม่ระบุชื่อบริษัทที่ต้องการอัปเดต")
    
    query = f"""
        UPDATE line_groups
        SET company_en = COALESCE(%(company_en)s, company_en),
            company_th = COALESCE(%(company_th)s, company_th),
            is_company_matched = CASE 
              WHEN %(on_create)s THEN TRUE 
              ELSE is_company_matched 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE line_group_id = %(group_id)s;
    """

    params = {
        "group_id": payload.group_id,
        "company_th": payload.company_th,
        "company_en": payload.company_en,
        "on_create": on_create
    }
    try:
        cursor_ctx = conn.cursor() if conn else pg_db.get_cursor()
        
        with cursor_ctx as cursor:
            cursor.execute(query, params)
            if cursor.rowcount == 0:
                raise BadRequestError(message="ไม่พบกลุ่มไลน์ที่ต้องการอัปเดต")
            
    except BadRequestError:
        raise
    
    except Exception as e:
        raise DatabaseError() from e


def update_company_graph(payload: Company):
    if not payload.group_id:
        raise BadRequestError(message="ไม่เจอกลุ่มไลน์ที่ต้องการอัปเดต") 
    
    if not payload.company_th and not payload.company_en:
        raise BadRequestError(message="ไม่ระบุชื่อบริษัทที่ต้องการอัปเดต")
    
    UPDATE_COMPANY_GRAPH = """
MERGE (c:Company {groupId: $group_id})
ON MATCH SET 
    c.nameTh = coalesce($company_th, c.nameTh),
    c.nameEn = coalesce($company_en, c.nameEn),
    c.updatedAt = datetime()
ON CREATE SET
    c.nameTh = $company_th,
    c.nameEn = $company_en,
    c.createdAt = datetime(),
    c.updatedAt = datetime()
RETURN c;
"""
    params = {
        "group_id": payload.group_id,
        "company_th": payload.company_th,
        "company_en": payload.company_en
    }
    try:
        with graph_db.get_session() as session:
            result = session.run( UPDATE_COMPANY_GRAPH, params)
            # if not result:
            #     raise BadRequestError(message="ไม่พบข้อมูลบริษัทที่ต้องการอัปเดต")
    except BadRequestError:
       raise
      
    except Exception as e:
        raise DatabaseError() from e

    
def sync_company(payload: Company, on_create: bool = False):
    with pg_db.get_connection() as conn:
        try:
            update_company_pg(payload, conn=conn, on_create=on_create)
            update_company_graph(payload)
            conn.commit()

        except Exception as e:
            conn.rollback()
            raise e
       