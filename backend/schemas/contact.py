from typing import Optional
from pydantic import BaseModel, Field

class ContactInfo(BaseModel):
    name_th: Optional[str] = Field(description="ชื่อผู้ประสานงานภาษาไทย")
    name_en: Optional[str] = Field(description="ชื่อผู้ประสานงานภาษาอังกฤษ")
    nickname: Optional[str] = Field(description="ชื่อเล่นของผู้ประสานงาน")
    job_title: Optional[str] = Field(description="ตำแหน่งงาน")
    phone: Optional[str] = Field(description="เบอร์โทรศัพท์")
    email: Optional[str] = Field(description="อีเมล")

class ContactList(BaseModel):
    contact_list: list[ContactInfo] = Field(description="รายการข้อมูลผู้ประสานงานทั้งหมดที่พบในแชท")
    company_th: Optional[str] = Field(description="ชื่อบริษัทภาษาไทย")
    company_en: Optional[str] = Field(description="ชื่อบริษัทภาษาอังกฤษ")
    
class MatchedCompany(BaseModel):
    company_name_th: Optional[str] = Field(description="ชื่อบริษัทภาษาไทย")
    company_name_en: Optional[str] = Field(description="ชื่อบริษัทภาษาอังกฤษ")