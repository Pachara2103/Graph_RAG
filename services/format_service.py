from collections import defaultdict

def person_cotact_format(records):

    markdown_lines = defaultdict(list)
    
    for r in records:
        c_names = [r.get(k) for k in ("cnameEn", "cnameTh") if r.get(k)]
        c_key = " - ".join(c_names) if c_names else "ไม่ระบุบริษัท"
        
        p_name = r.get('nameTh') or r.get('nameEn') or ''
        if r.get('nameTh') and r.get('nameEn'):
            p_name = f"{r['nameTh']} ({r['nameEn']})"
            
        nickname = f" ชื่อเล่น: {r['nickname']}" if r.get('nickname') else ""
        phone = f" เบอร์โทร: {r['phone']}" if r.get('phone') else ""
        email = f" อีเมลล์: {r['email']}" if r.get('email') else ""
    
        labels = r.get('label', [])
        role = f"({', '.join(labels)}) " if labels else ""
        
        markdown_lines[c_key].append(f"{role}{p_name}{nickname}")

    context = ["### Context"]
    for company, members in markdown_lines.items():
        context.append(f"\n**บริษัท:** {company}")
        for member in members:
            context.append(f"- {member}")
            
    return "\n".join(context)

def note_format(records):
    
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