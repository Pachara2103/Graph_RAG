from core.db import graph_db

SEARCH_COMPANY_QUERY  = """
CALL db.index.fulltext.queryNodes("companyNameIndex", $searchTerm) 
YIELD node, score
WITH node, score
RETURN node.nameTh AS company_th, node.nameEn AS company_en, node.aliases AS aliases, score
LIMIT 10
"""

def search_company(search_input) -> list:
    search_query = f"{search_input}^2 OR {search_input}~2 OR {search_input}*"
    with graph_db.get_session() as session:
       result = session.run(SEARCH_COMPANY_QUERY, searchTerm=search_query)
       result = result.data()
    return result




SEARCH_PERSON_QUERY  = """
CALL db.index.fulltext.queryNodes("personNameIndex", $searchTerm) 
YIELD node, score
WITH node, score
LIMIT 10

OPTIONAL MATCH (c:Company)-[:HAS_HR|HAS_COORDINATOR]->(node)

RETURN 
       labels(node) AS label,
       node.nameEn AS nameEn, 
       node.nameTh AS nameTh, 
       node.nickname AS nickname, 
       c.nameEn AS cnameEn, 
       c.nameTh AS cnameTh, 
       score
"""

def search_person(search_input):
    search_query = f"{search_input}^2 OR {search_input}~2 OR {search_input}*"
    with graph_db.get_session() as session:
      result = session.run(SEARCH_PERSON_QUERY, searchTerm=search_query)
      result = result.data()
    return result
