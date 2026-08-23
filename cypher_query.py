retrieve_context_query = """
CALL () {
  MATCH (n:Note)
  SEARCH n IN (VECTOR INDEX vectorIndex FOR $query_vector LIMIT $top_k)
  RETURN collect(n) AS vecNodes
}

CALL () {
  CALL db.index.fulltext.queryNodes("fulltextIndex", $search_query) YIELD node AS ftNode
  RETURN collect(ftNode) AS ftNodes
}

WITH vecNodes + ftNodes AS rawNodes

UNWIND rawNodes AS mNode

MATCH (c:Company)
WHERE c = mNode 
   OR (c)-[:HAS_NOTE]->(mNode) 
   OR (c)-[:HAS_HR]->(mNode)
   OR (c)-[:HAS_HR]->(:HR)-[:HAS_NOTE]->(mNode)

WITH DISTINCT c

OPTIONAL MATCH (c)-[:HAS_HR]->(hr:HR)
OPTIONAL MATCH (hr)-[:HAS_NOTE]->(hr_note:Note)

WITH c, hr, collect(DISTINCT hr_note.message) AS hr_notes
WITH c, 
     case when hr IS NOT NULL then {
         name: hr.name,
         phone: hr.phone,
         status: hr.status,
         notes: hr_notes
     } else null end AS hr_obj

OPTIONAL MATCH (c)-[:HAS_NOTE]->(company_note:Note)

RETURN 
    c.name AS company_name,
    collect(DISTINCT hr_obj) AS hr_list,
    collect(DISTINCT {
        created_at: company_note.createdAt,
        message: company_note.message
    }) AS company_note_list
"""



CREATE_COMPANIES = """
UNWIND [
  { cEn: "PTT Public Company Limited", cTh: "บริษัท ปตท. จำกัด (มหาชน)", alias1: "PTT", alias2: "ปตท", alias3: "ปตท.", hrEn: "Somchai Srisai", hrTh: "สมชาย ศรีใส", nick: "Boy" },
  { cEn: "Siam Cement Group", cTh: "เครือซิเมนต์ไทย", alias1: "SCG", alias2: "เอสซีจี", alias3: "ปูนใหญ่", hrEn: "Somchai Wongsuwan", hrTh: "สมชาย วงศ์สุวรรณ", nick: "Max" },
  { cEn: "CP ALL Public Company Limited", cTh: "บริษัท ซีพี ออลล์ จำกัด (มหาชน)", alias1: "CPALL", alias2: "ซีพีออลล์", alias3: "7-Eleven", hrEn: "Anan Boonmee", hrTh: "อนันต์ บุญมี", nick: "Boy" },
  { cEn: "Kasikornbank", cTh: "ธนาคารกสิกรไทย", alias1: "KBank", alias2: "กสิกร", alias3: "KBANK", hrEn: "Anan Saetang", hrTh: "อนันต์ แซ่ตั้ง", nick: "Golf" },
  { cEn: "Central Retail Corporation", cTh: "เซ็นทรัล รีเทล คอร์ปอเรชั่น", alias1: "CRC", alias2: "เซ็นทรัลรีเทล", hrEn: "Nattapong Kaewmanee", hrTh: "ณัฐพงษ์ แก้วมณี", nick: "Boy" },
  { cEn: "Advanced Info Service", cTh: "บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)", alias1: "AIS", alias2: "เอไอเอส", hrEn: "Kittisak Rattanapan", hrTh: "กิตติศักดิ์ รัตนพันธ์", nick: "Golf" },
  { cEn: "True Corporation", cTh: "บริษัท ทรู คอร์ปอเรชั่น จำกัด (มหาชน)", alias1: "TRUE", alias2: "ทรู", hrEn: "Somchai Jaidee", hrTh: "สมชาย ใจดี", nick: "Jay" },
  { cEn: "Bangkok Airways", cTh: "บางกอกแอร์เวย์ส", alias1: "BA", alias2: "บางกอกแอร์", hrEn: "Siriwan Chaimongkol", hrTh: "ศิริวรรณ ชัยมงคล", nick: "May" },
  { cEn: "Thai Airways International", cTh: "การบินไทย", alias1: "THAI", alias2: "TG", alias3: "การบินไทย", hrEn: "Siriwan Prasert", hrTh: "ศิริวรรณ ประเสริฐ", nick: "May" },
  { cEn: "SCB X Public Company Limited", cTh: "บริษัท เอสซีบี เอกซ์ จำกัด (มหาชน)", alias1: "SCB", alias2: "SCBX", alias3: "ไทยพาณิชย์", hrEn: "Nattapong Charoen", hrTh: "ณัฐพงษ์ เจริญ", nick: "Max" },
  { cEn: "Indorama Ventures", cTh: "อินโดรามา เวนเจอร์ส", alias1: "IVL", alias2: "อินโดรามา", hrEn: "Wichai Somboon", hrTh: "วิชัย สมบูรณ์", nick: "Tom" },
  { cEn: "Minor International", cTh: "ไมเนอร์ อินเตอร์เนชั่นแนล", alias1: "MINT", alias2: "ไมเนอร์", hrEn: "Wichai Thongchai", hrTh: "วิชัย ธงชัย", nick: "Tom" },
  { cEn: "Gulf Energy Development", cTh: "กัลฟ์ เอ็นเนอร์จี ดีเวลลอปเมนท์", alias1: "GULF", alias2: "กัลฟ์", hrEn: "Kittisak Srisawat", hrTh: "กิตติศักดิ์ ศรีสวัสดิ์", nick: "Jay" },
  { cEn: "BDMS - Bangkok Dusit Medical Services", cTh: "กรุงเทพดุสิตเวชการ", alias1: "BDMS", alias2: "หมอปราเสริฐ", alias3: "กรุงเทพดุสิต", hrEn: "Pornpimol Suwan", hrTh: "พรพิมล สุวรรณ", nick: "May" },
  { cEn: "PTT Global Chemical", cTh: "พีทีที โกลบอล เคมิคอล", alias1: "GC", alias2: "PTTGC", alias3: "พีทีทีจีซี", hrEn: "Pornpimol Rattana", hrTh: "พรพิมล รัตนะ", nick: "Nok" }
] AS row

CREATE (c:Company {
  nameEn: row.cEn,
  nameTh: row.cTh,
  aliases: [x IN [row.alias1, row.alias2, row.alias3] WHERE x IS NOT NULL]
})

CREATE (h:HR {
  nameEn: row.hrEn,
  nameTh: row.hrTh,
  nickname: row.nick
})

CREATE (c)-[:HAS_HR]->(h)
"""