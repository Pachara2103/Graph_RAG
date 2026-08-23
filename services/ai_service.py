from core.ai import get_llm
from prompts.rag_prompts import get_rag_prompt
from retrieval_service import retrieve_note_context

def ai_assistant(question, top_k=10):
    llm = get_llm()
    context = retrieve_note_context(question, top_k=top_k)
    prompt = get_rag_prompt(context, question)
    response = llm.invoke(prompt)
    return response