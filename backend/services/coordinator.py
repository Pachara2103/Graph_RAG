
import logging
from datetime import datetime
from neo4j.exceptions import  Neo4jError
import logging
from core.db import graph_db, pg_db
from schemas.coordinator import Coordinator, CoordinatorList
from typing import Any
from core.exceptions import NotFoundError, DatabaseError, BadRequestError

def get_coordinator(coordinator_id: int) -> Coordinator:
    try:
      with pg_db.get_cursor() as cursor:
        cursor.execute("""
            SELECT id, group_id, name_th, name_en, nickname, job_title, phone, email, relevant, status, updated_at 
            FROM approval_logs 
            WHERE id = %s;
        """, (coordinator_id,))
        result = cursor.fetchone()

      if not result:
        raise NotFoundError("ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
    
      keys = [
            "id", 
            "group_id", 
            "name_th", 
            "name_en", 
            "nickname", 
            "job_title", 
            "phone", 
            "email", 
            "relevant", 
            "status", 
            "updated_at"
        ]
        
      data = dict(zip(keys, result))
      return Coordinator(**data)
    
    except NotFoundError:
        raise
    except Exception as e:
      raise DatabaseError() from e
  
  
    
def get_coordinators() -> CoordinatorList:
    query = """
    SELECT 
        id, group_id, name_th, name_en, nickname, job_title, phone, 
        email, relevant, status, updated_at 
    FROM approval_logs;
    """
    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            
            colnames = [desc[0] for desc in cursor.description]
            
            coordinators_data = [
                Coordinator(**dict(zip(colnames, row))) 
                for row in rows
            ]
            
        return CoordinatorList(coordinators=coordinators_data)
            
    except Exception as e:
        raise DatabaseError() from e
    
    

UPDATE_STATUS = """
    UPDATE approval_logs 
    SET user_id = %(user_id)s,
        status = %(status)s,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = %(coordinator_id)s;
    """
    
def approve_pg(coordinator_id: int, user_id: str, conn: Any = None):
    if not coordinator_id:
        raise BadRequestError(message="ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
    
    try:
        cursor_ctx = conn.cursor() if conn else pg_db.get_cursor()
        
        with cursor_ctx as cursor:
            cursor.execute(
                UPDATE_STATUS,
                {
                    "coordinator_id": coordinator_id, 
                    "status": "approved", 
                    "user_id": user_id,
                }
            )
            if cursor.rowcount == 0:
                raise NotFoundError(message="ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
       
    except NotFoundError:
        raise
         
    except BadRequestError:
        raise
    
    except Exception as e:
        raise DatabaseError() from e


ADD_NEW_COORDINATOR_GRAPH = """
MATCH (c:Company {groupId: $group_id})
CREATE (p:Coordinator {
    id: $id,
    groupId: $group_id,
    nameTh: $name_th,
    nameEn: $name_en,
    nickname: $nickname,
    jobTitle: $job_title,
    phone: $phone,
    email: $email,
    relevant: $relevant,
    status: $status,
    updatedAt: $updated_at
})
CREATE (c)-[:HAS_COORDINATOR]->(p)
RETURN p AS coordinator
"""

def approve_graph(coordinator_id: int):
    if not coordinator_id:
        raise BadRequestError(message="ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
    
    try:
        target = get_coordinator(coordinator_id)
        params = {
            "id": coordinator_id,
            "group_id": target.group_id,
            "name_th": target.name_th,
            "name_en": target.name_en,
            "nickname": target.nickname,
            "job_title": target.job_title,
            "phone": target.phone,
            "email": target.email,
            "relevant": target.relevant
        }
        params["updated_at"] = datetime.now().isoformat()
        params["status"] = "approved"
        
        with graph_db.get_session() as session:
            result = session.run(
                ADD_NEW_COORDINATOR_GRAPH, 
                params
            )
            record = result.single()
            if not record:
                raise NotFoundError(message="ไม่พบข้อมูลบริษัทที่ต้องการอัปเดต")
            
    except NotFoundError:
        raise
    except BadRequestError:
        raise
    except Exception as e:
        raise DatabaseError() from e
    
    
    
def sync_approve(coordinator_id: int, user_id: str):
    with pg_db.get_connection() as conn:
        try:
            approve_pg(coordinator_id, user_id, conn=conn)
            approve_graph(coordinator_id)
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e

    
def decline(coordinator_id: int, user_id: str="bot"):
    if not coordinator_id:
        raise BadRequestError(message="ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(
                UPDATE_STATUS, 
                {
                    "coordinator_id": coordinator_id, 
                    "status": "declined", 
                    "user_id": user_id,
                }
            )
            
            if cursor.rowcount == 0:
                raise NotFoundError(message="ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
            
            return 
    except NotFoundError:
        raise
    
    except BadRequestError:
        raise
    
    except Exception as e:
        raise DatabaseError() from e
    
    

def create_pending_coordinator(payload: Coordinator, user_id: str):
    sql = """
        INSERT INTO approval_logs (
            group_id, user_id, status, name_th, name_en, nickname, 
            job_title, phone, email, relevant
        )
        VALUES (
            %(group_id)s, %(user_id)s, %(status)s, %(name_th)s, %(name_en)s, %(nickname)s, 
            %(job_title)s, %(phone)s, %(email)s, %(relevant)s
        )
    """
        
    params = {
        "group_id": payload.group_id,
        "name_th": payload.name_th,
        "name_en": payload.name_en,
        "nickname": payload.nickname,
        "job_title": payload.job_title,
        "phone": payload.phone,
        "email": payload.email,
        "relevant": payload.relevant
    }
    params["status"] = payload.status or "pending"
    params["user_id"] = user_id
    
    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(sql, params)              

    except Exception as e:
        raise DatabaseError() from e
    
# ---------------------------------------------------------------------------------------------------------


UPDATE_COORDINATOR = """
    UPDATE approval_logs 
    SET user_id = %(user_id)s,
        name_th = %(name_th)s,
        name_en = %(name_en)s,
        nickname = %(nickname)s,
        job_title = %(job_title)s,
        phone = %(phone)s,
        email = %(email)s,
        relevant = %(relevant)s,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = %(id)s;
"""
    
def update_coordinator_pg(payload: Coordinator, user_id: str):
    if not payload.id:
        raise BadRequestError(message="ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
    
    params = {
        "id": payload.id,
        # "group_id": payload.group_id,
        "name_th": payload.name_th,
        "name_en": payload.name_en,
        "nickname": payload.nickname,
        "job_title": payload.job_title,
        "phone": payload.phone,
        "email": payload.email,
        "relevant": payload.relevant,
        # "status": payload.status,
        "user_id": user_id,
        # "updated_at": datetime.now().isoformat()
    }
    
    try:        
        with pg_db.get_cursor() as cursor:
            cursor.execute(
                UPDATE_COORDINATOR, 
                params
            )
            if cursor.rowcount == 0:
                raise NotFoundError(message="ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
       
    except NotFoundError:
        raise
         
    except BadRequestError:
        raise
    
    except Exception as e:
        raise DatabaseError() from e


# UPDATE_COORDINATOR_GRAPH = """
# MATCH (c:Coordinator {id: $id})
# SET 
#     nameTh: $name_th,
#     nameEn: $name_en,
#     nickname: $nickname,
#     jobTitle: $job_title,
#     phone: $phone,
#     email: $email,
#     relevant: $relevant,
#     updatedAt: datetime()
# })
# RETURN c AS coordinator
# """

# def update_coordinator_graph(payload: Coordinator):
#     if not payload.id:
#         raise BadRequestError(message="ไม่พบข้อมูลผู้ประสานงานที่ต้องการ")
    
#     params = {
#         "id": payload.id,
#         # "group_id": payload.group_id,
#         "name_th": payload.name_th,
#         "name_en": payload.name_en,
#         "nickname": payload.nickname,
#         "job_title": payload.job_title,
#         "phone": payload.phone,
#         "email": payload.email,
#         "relevant": payload.relevant,
#         # "status": payload.status,
#         # "user_id": user_id,
#         # "updated_at": datetime.now().isoformat()
#     }
    
#     try:
        
#         with graph_db.get_session() as session:
#             result = session.run(
#                 UPDATE_COORDINATOR_GRAPH, 
#                 params
#             )
#             record = result.single()
#             if not record:
#                 raise NotFoundError(message="ไม่พบข้อมูลบริษัทที่ต้องการอัปเดต")
            
#     except NotFoundError:
#         raise
#     except BadRequestError:
#         raise
#     except Exception as e:
#         raise DatabaseError() from e
    
    
    
# def sync_update_coordinator(payload: Coordinator, user_id: str):
#     with pg_db.get_connection() as conn:
#         try:
#             update_coordinator_pg(payload, user_id, conn=conn)
#             approve_graph(payload)
#             conn.commit()
            
#         except Exception as e:
#             conn.rollback()
#             raise e
