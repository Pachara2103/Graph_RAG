from langchain_google_genai import ChatGoogleGenerativeAI
from neo4j_graphrag.embeddings import SentenceTransformerEmbeddings

_llm_instance = None
_embedder_instance = None

def get_llm():
    global _llm_instance
    if _llm_instance is None:
        print("...Loading LLM model")
        _llm_instance = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite", 
            # temperature=0
        )
        print("Loaded LLM model.")
    return _llm_instance

def get_embedder():
    global _embedder_instance
    if _embedder_instance is None:
        print("...Loading Embedding model")
        # โหลดโมเดลเฉพาะเมื่อยังไม่มีการโหลดมาก่อน
        _embedder_instance = SentenceTransformerEmbeddings(model="BAAI/bge-m3")
        print("Loaded Embedding model (BAAI/bge-m3).")
    return _embedder_instance