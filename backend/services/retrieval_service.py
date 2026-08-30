from backend.test.cypher_query import retrieve_context_query

from core.db import db
from core.ai import get_embedder
from services.output_format import note_format


def retrieve_note_context(question, top_k):
    embedder = get_embedder()
    with db.get_session() as session:
      result = session.run(
        retrieve_context_query, 
        search_query=question, 
        top_k=top_k, 
        query_vector=embedder.embed_query(question)
      )
      records = result.data()
      return note_format(records)