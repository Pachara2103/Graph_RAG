from langchain_core.prompts import ChatPromptTemplate
from core.ai import get_llm
from schemas.contact import ContactInfo, MatchedCompany
from prompts.contact_prompts import GET_CONTACT_PROMPT, MATCH_COMPANY_PROMPT

llm = get_llm()

contact_prompt = ChatPromptTemplate.from_messages([
    ("system", GET_CONTACT_PROMPT),
    ("user", "Chat History:\n{chat_history}")
])
extract_contact_chain = contact_prompt | llm.with_structured_output(ContactInfo)


match_prompt = ChatPromptTemplate.from_messages([
    ("system", MATCH_COMPANY_PROMPT),
    ("user", "เป้าหมายบริษัทที่ต้องการจับคู่: {target_company}\nรายชื่อบริษัท:\n{company_list}")
])
match_company_chain = match_prompt | llm.with_structured_output(MatchedCompany)