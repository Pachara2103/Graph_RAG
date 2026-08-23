import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import streamlit as st
from datetime import datetime
from streamlit_searchbox import st_searchbox
from services.search_service import search_company
from services.chat_service import get_pending_approvals

value_mapping = {
    "company_name_th": "ชื่อบริษัท (TH)",
    "company_name_en": "ชื่อบริษัท (ENG)",
    "name_th": "ชื่อผู้ประสานงาน (TH)",
    "name_en": "ชื่อผู้ประสานงาน (EN)",
    "nickname": "ชื่อเล่น",
    "job_title": "ตำแหน่ง",
    "phone": "เบอร์โทร",
    "email": "อีเมลล์",
}

def generate_summary_text(result):
    summary_text = ""
    for key in value_mapping:
        val = result.get(key)
        text = val if val else "<ไม่มีข้อมูล>"
        summary_text += f"{value_mapping[key]}: {text}\n"
    return summary_text

def get_company_list(search_term: str):
    if not search_term or not search_term.strip():
        return []

    company_list = search_company(search_term)

    options = []
    for company in company_list:
        th_name = company.get("company_name_th") or "<ไม่มีชื่อภาษาไทย>"
        en_name = company.get("company_name_en") or "<ไม่มีชื่อภาษาอังกฤษ>"
        
        label = f"{en_name}, {th_name}"
        options.append((label, company))

    return options

def reset_company_search(idx_to_reset):
    st.session_state.pop(f"company_searchbox_{idx_to_reset}", None)
                
st.title("NextLink AI")
st.caption("ระบบผู้ช่วย AI สรุปข้อมูลอัตโนมัติจาก Group Line")

if "appenging_contact_list" not in st.session_state:
    st.session_state.appenging_contact_list = []
if "editing_index" not in st.session_state:
    st.session_state.editing_index = None
if "selected_company" not in st.session_state:
    st.session_state.selected_company = None

if st.button("อัปเดตข้อมูล", type="primary"):
    with st.spinner("กำลังวิเคราะห์ข้อมูล..."):
        now_str = datetime.now().isoformat()
        # st.session_state.appenging_contact_list = [
        #     {
        #         'company_name_th': 'ลาเทค คอมพานี',
        #         'company_name_en': 'LaTech Company',
        #         'name_th': 'พชร อุ้ยกิ้ม',
        #         'name_en': 'Pachara Auikim',
        #         'nickname': 'บาส',
        #         'job_title': 'HR',
        #         'phone': '012-345-6789',
        #         'email': 'Bas@latech.com',
        #         'line_group_name': 'Test NextLink 1',
        #         'is_company_matched': False
        #     }]
        # st.session_state.appenging_contact_list = get_pending_approvals(user_id=st.session_state.user_id)
        st.session_state.appenging_contact_list = get_pending_approvals(user_id="test_user_id")        
        st.session_state.editing_index = None
        st.rerun()

st.divider()

if st.session_state.appenging_contact_list:
    st.session_state.appenging_contact_list.sort(
        key=lambda x: (x.get('status') == 'completed', x.get('updated_at', ''))
    )

    for idx, contact in enumerate(st.session_state.appenging_contact_list):
        if st.session_state.editing_index != idx:
            st.subheader(contact.get("line_group_name", f"Group {idx+1}"))
            
            summary_text = generate_summary_text(contact)
            st.code(summary_text, language="text")
            if contact.get("is_company_matched"):
                st.write(":green[พบบริษัทในฐานข้อมูล]")
            else:
                st.write(":yellow[ไม่พบบริษัทในฐานข้อมูล]")
            
            if contact.get("status") == "completed":
                st.success("✅ บันทึกแล้ว")
            else:
                col1, col2 = st.columns(2)
                
                with col1:
                    is_matched = contact.get("is_company_matched")
                    btn_label = "ยืนยัน" if is_matched else "สร้างใหม่"
                    # btn_type = "secondary" if is_matched else "primary"
                    if st.button(btn_label, key=f"confirm_{idx}", type="primary", use_container_width=True):
                        try:
                            contact["status"] = "completed"
                            contact["updated_at"] = datetime.now().isoformat()
                            st.rerun()
                        except Exception as e:
                            st.error(f"เกิดข้อผิดพลาดในการบันทึก: {e}")

                with col2:
                    if st.button("แก้ไข", key=f"edit_{idx}", use_container_width=True):
                        st.session_state.editing_index = idx
                        st.session_state.pop(f"company_action_{idx}", None)
                        st.session_state.pop(f"company_searchbox_{idx}", None)
                        st.rerun()

        else:
            st.subheader(f"แก้ไขข้อมูลกลุ่ม: {contact.get('line_group_name', 'ไม่มีชื่อกลุ่ม')}")
          

            default_index = 0 if contact.get("is_company_matched", False) else 1
            company_action = st.radio(
              "ประเภท",
              options=["ค้นหาบริษัทในระบบ", "เพิ่มบริษัท"],
              index=default_index,
              key=f"company_action_{idx}",
              on_change=reset_company_search,
              args=(idx,)
            )

            match_company = company_action == "ค้นหาบริษัทในระบบ"
            add_new_company = company_action == "เพิ่มบริษัท"
            
            edited_data = contact.copy()
            selected_company = None
            
            if match_company:
                
                default_company = None
                if contact.get("is_company_matched") and (contact.get("company_name_th") or contact.get("company_name_en")):
                    default_company = {
                      "company_name_th": contact.get("company_name_th", ""),
                      "company_name_en": contact.get("company_name_en", "")
                    }

                selected_company = st_searchbox(
                    get_company_list,
                    default=default_company,
                    key=f"company_searchbox_{idx}",
                    placeholder="พิมพ์ชื่อบริษัทเพื่อค้นหา...",
                    clear_on_submit=False,
                )
                
                if selected_company:
                    # st.code(selected_company, language="text")
                    new_th = selected_company.get("company_name_th", "")
                    new_en = selected_company.get("company_name_en", "")

                    edited_data["company_name_th"] = new_th
                    edited_data["company_name_en"] = new_en
                    edited_data["is_company_matched"] = True

                    # st.session_state[f"input_company_name_th_{idx}"] = new_th
                    # st.session_state[f"input_company_name_en_{idx}"] = new_en
                else:
                    edited_data["company_name_th"] = "ยังไม่เลือกบริษัท"
                    edited_data["company_name_en"] = "ยังไม่เลือกบริษัท"
                    edited_data["is_company_matched"] = False
            else:
                edited_data["is_company_matched"] = False
                if edited_data.get("company_name_th") == "ยังไม่เลือกบริษัท":
                    edited_data["company_name_th"] = ""
                if edited_data.get("company_name_en") == "ยังไม่เลือกบริษัท":
                    edited_data["company_name_en"] = ""

            with st.form(key=f"edit_form_{idx}"):
                input_values = {}
                for key, label in value_mapping.items():
                    current_val = edited_data.get(key) or ""
                    is_disabled = (not add_new_company) and (key in ["company_name_th", "company_name_en"])
                    
                    company_identifier = edited_data.get("company_name_en") or "none"

                    # input_key = f"input_{key}_{idx}"
                    # if input_key not in st.session_state:
                    #     st.session_state[input_key] = current_val

                    input_values[key] = st.text_input(
                      label, 
                      value=current_val, 
                      disabled=is_disabled,
                      key=f"input_{key}_{idx}_{company_identifier}"
                    )
                    #ระบบเสิร์ชล็อก
        
                col1, col2 = st.columns(2)
                
                with col1:
                    save_btn = st.form_submit_button("บันทึกการแก้ไข", type="primary", use_container_width=True)
                    if save_btn:
                        # แก้ปัญหาข้อ 1: Validation ตรวจสอบเงื่อนไขก่อนบันทึก
                        if not add_new_company and not selected_company and not contact.get("is_company_matched"):
                            st.error("⚠️ กรุณาเลือกบริษัทจากระบบ หรือ ติ๊ก 'เพิ่มบริษัท (กรอกชื่อบริษัทใหม่)' ก่อนบันทึก")
                        else:
                            selected_company = None
                            for key in value_mapping:
                                val = input_values[key]
                                edited_data[key] = val.strip() if val and val.strip() != "" else None
                            
                            edited_data["updated_at"] = datetime.now().isoformat()
                            
                            st.session_state.appenging_contact_list[idx] = edited_data
                            st.session_state.pop(f"company_action_{idx}", None)
                            st.session_state.pop(f"company_searchbox_{idx}", None)
                            st.session_state.editing_index = None
                            st.rerun()

                with col2:
                    cancel_btn = st.form_submit_button("ยกเลิก", use_container_width=True)
                    if cancel_btn:
                        st.session_state.pop(f"company_action_{idx}", None)
                        st.session_state.pop(f"company_searchbox_{idx}", None)
                        st.session_state.editing_index = None
                        st.info("ยกเลิกการแก้ไข")
                        st.rerun()
        
        st.divider()
