retrieve_context_query = """
MATCH (n:Note)
SEARCH n IN (VECTOR INDEX vectorIndex FOR $query_vector LIMIT $top_k)  
WITH collect(n) AS vecNodes

CALL db.index.fulltext.queryNodes("fulltextIndex", $search_query) YIELD node AS ftNode
WITH vecNodes, collect(ftNode) AS ftNodes

WITH vecNodes + ftNodes AS matchedNodes
UNWIND matchedNodes AS mNode

MATCH (c:Company)
WHERE c = mNode 
   OR (c)-[:HAS_NOTE]->(mNode) 
   OR (c)-[:HAS_HR]->(mNode)
   OR (c)-[:HAS_HR]->(:HR)-[:HAS_NOTE]->(mNode)

WITH DISTINCT c

OPTIONAL MATCH (c)-[:HAS_HR]->(hr:HR)
OPTIONAL MATCH (hr)-[:HAS_NOTE]->(hr_note:Note)

WITH c, hr, collect(DISTINCT hr_note.message) AS hr_notes
WITH c, 
     case when hr IS NOT NULL then {
         name: hr.name,
         phone: hr.phone,
         status: hr.status,
         notes: hr_notes
     } else null end AS hr_obj

OPTIONAL MATCH (c)-[:HAS_NOTE]->(company_note:Note)

RETURN 
    c.name AS company_name,
    collect(DISTINCT hr_obj) AS hr_list,
    collect(DISTINCT {
        created_at: company_note.createdAt,
        message: company_note.message
    }) AS company_note_list
"""