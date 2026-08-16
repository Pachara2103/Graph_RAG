import streamlit as st
from ai import ai_assistant

st.set_page_config(
    page_title="NextLink AI",
    page_icon="🤖",
    layout="centered"
)

st.title("🤖 NextLink AI")
st.caption("ระบบผู้ช่วย AI ค้นหาข้อมูล และตอบคำถาม")

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        # แสดง Token usage (ถ้ามีเก็บไว้ในประวัติ)
        if "usage" in message:
            usage = message["usage"]
            st.caption(
                f"📊 Tokens — Input: {usage.get('input_tokens', 0)} | "
                f"Output: {usage.get('output_tokens', 0)} | "
                f"Total: {usage.get('total_tokens', 0)}"
            )

if user_query := st.chat_input("พิมพ์คำถามของคุณที่นี่..."):

    st.chat_message("user").markdown(user_query)
    st.session_state.messages.append({"role": "user", "content": user_query})

    # 2. ประมวลผลและแสดงคำตอบฝั่ง Assistant
    with st.chat_message("assistant"):
        with st.spinner("กำลังค้นหาข้อมูล..."):
            try:
                response = ai_assistant(user_query)
                
                if isinstance(response.content, str):
                    answer_text = response.content
                elif isinstance(response.content, list) and len(response.content) > 0:
                    answer_text = response.content[0].get('text', 'ไม่มีข้อมูลคำตอบ')
                else:
                    answer_text = str(response.content)

                st.markdown(answer_text)
                
                usage_info = getattr(response, 'usage_metadata', {})
                if usage_info:
                    st.caption(
                        f"📊 Tokens — Input: {usage_info.get('input_tokens', 0)} | "
                        f"Output: {usage_info.get('output_tokens', 0)} | "
                        f"Total: {usage_info.get('total_tokens', 0)}"
                    )

                st.session_state.messages.append({
                    "role": "assistant",
                    "content": answer_text,
                    "usage": usage_info
                })

            except Exception as e:
                error_msg = f"เกิดข้อผิดพลาด: {e}"
                st.error(error_msg)