from langchain_core.prompts import ChatPromptTemplate
from core.ai import get_llm
from schemas.contact import ContactList
from prompts.contact_prompts import GET_CONTACT_PROMPT, MATCH_COMPANY_PROMPT

llm = get_llm()

contact_prompt = ChatPromptTemplate.from_messages([
    ("system", GET_CONTACT_PROMPT),
    ("user", "Chat History:\n{chat_history}")
])
extract_contact_chain = contact_prompt | llm.with_structured_output(ContactList)