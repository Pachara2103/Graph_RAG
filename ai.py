from langchain_google_genai import ChatGoogleGenerativeAI
from neo4j_graphrag.embeddings import SentenceTransformerEmbeddings
from db_connection import db

_llm_instance = None
_embedder_instance = None

def get_llm():
    global _llm_instance
    if _llm_instance is None:
        print("...Loading LLM model")
        _llm_instance = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite", temperature=0
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

def get_prompt(context, user_query):
    prompt = f"""
คุณเป็นผู้ช่วย AI ที่มีหน้าที่ตอบคำถามโดยอิงจาก Context เท่านั้น

ตอบคำถามของผู้ใช้โดยปฏิบัติตามกฎดังนี้:
1. ใช้ข้อมูลจาก Context ด้านล่างนี้ในการตอบเท่านั้น ห้ามสมมติหรือคิดไปเอง
2. หากใน Context ไม่มีข้อมูลเพียงพอสำหรับตอบคำถาม ให้ตอบตรงๆ ว่า "ไม่มีข้อมูลในระบบ"
3. สรุปข้อมูลให้กระชับ อ่านง่าย และตรงประเด็น

Context:
{context}

คำถามของผู้ใช้: {user_query}
คำตอบ:
"""
    return prompt




from cypher_query import retrieve_context_query

def format_output(records):
    
    markdown_lines = ["### Context\n"]
    
    for idx, record in enumerate(records, start=1):
        company_name = record.get("company_name", "N/A")
        hr_list = [hr for hr in record.get("hr_list", []) if hr.get("name")]
        company_note_list = [note for note in record.get("company_note_list", []) if note.get("message")]
        
        markdown_lines.append(f"{idx}. Company: {company_name}")
        
        if hr_list:
            markdown_lines.append("   - HR Personnel:")
            for num, hr in enumerate(hr_list, start=1):
                name = hr.get("name", "-")
                phone = hr.get("phone", "-")
                status = hr.get("status", "-")
                hr_notes = hr.get("notes", [])
                clean_notes = [n for n in hr_notes if n]
                note_str = f" | โน้ต: {', '.join(clean_notes)}" if clean_notes else ""
        
                markdown_lines.append(f"     {num}. ชื่อ: {name} | โทร: {phone} | สถานะ: {status}{note_str}")
        else:
            markdown_lines.append("   - HR Personnel: (ไม่มีข้อมูล)")
            
        if company_note_list:
            markdown_lines.append("   - Notes for company:")
            for note in company_note_list:
                date = note.get("created_at", "-")
                msg = note.get("message", "-")
                markdown_lines.append(f'     - {date}: {msg}')
        else:
            markdown_lines.append("   - Notes for company: (ไม่มีข้อมูล)")
            
        markdown_lines.append("") 

    return "\n".join(markdown_lines)

def get_context(question, top_k):
    embedder = get_embedder()
    with db.get_session() as session:
      result = session.run(
        retrieve_context_query, 
        search_query=question, 
        top_k=top_k, 
        query_vector=embedder.embed_query(question)
      )
    
      records = result.data()
      formatted_context = format_output(records)
      print(formatted_context)
      return formatted_context
  
  
def ai_assistant(question, top_k=10):
    
    llm = get_llm()
    context = get_context(question, top_k=top_k)
    prompt = get_prompt(context, question)
    response = llm.invoke(prompt)
    return response