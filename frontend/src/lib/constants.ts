import type { CoordinatorField, SortOption } from "@/types";

/** Sentinel the extraction pipeline writes when a field could not be found. */
export const NO_DATA = "<ไม่มีข้อมูล>";

export const RELEVANT_OPTIONS = [
  NO_DATA,
  "MOU",
  "วิชาเลือก",
  "ฝึกงาน",
  "สหกิจศึกษา",
  "กิจกรรมอื่นๆ",
] as const;

/** Field order drives both the summary list and the two-column form. */
export const COORDINATOR_FIELDS: CoordinatorField[] = [
  "nameTh",
  "nameEn",
  "nickname",
  "jobTitle",
  "phone",
  "email",
  "relevant",
];

export const FIELD_LABELS: Record<CoordinatorField, string> = {
  nameTh: "ชื่อผู้ประสานงาน (TH)",
  nameEn: "ชื่อผู้ประสานงาน (EN)",
  nickname: "ชื่อเล่น",
  jobTitle: "ตำแหน่ง",
  phone: "เบอร์โทร",
  email: "อีเมล",
  relevant: "กิจกรรมที่เกี่ยวข้อง",
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "time-desc", label: "เวลา (ใหม่สุด)" },
  { value: "time-asc", label: "เวลา (เก่าสุด)" },
  { value: "group-name", label: "ชื่อกลุ่มไลน์" },
  { value: "company-th", label: "ชื่อบริษัทภาษาไทย" },
  { value: "company-en", label: "ชื่อบริษัทภาษาอังกฤษ" },
];

export const ITEMS_PER_PAGE = 5;

export const MESSAGES = {
  requireCoordinatorName: "กรุณากรอกชื่อผู้ประสานงาน (อย่างน้อยหนึ่งภาษา)",
  requireCompanyName: "กรุณากรอกหรือเลือกชื่อบริษัท",
  coordinatorSaveFailed: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
  companySaveFailed: "เกิดข้อผิดพลาดในการเพิ่มชื่อบริษัท กรุณาลองใหม่อีกครั้ง",

  /**
   * What each toast leads with when the API sent a reason of its own. The
   * backend names the cause ("ไม่พบบริษัทของกลุ่มนี้ในฐานข้อมูล"); only the
   * console knows which action the user was taking when it happened.
   */
  syncPrefix: "โหลดข้อมูลไม่สำเร็จ",
  coordinatorPrefix: "บันทึกข้อมูลผู้ประสานงานไม่สำเร็จ",
  declinePrefix: "ลบข้อมูลผู้ประสานงานไม่สำเร็จ",
  companyPrefix: "บันทึกชื่อบริษัทไม่สำเร็จ",
  loginPrefix: "เข้าสู่ระบบไม่สำเร็จ",

  /** The company write never reached the API. */
  companyNetworkFailed:
    "บันทึกชื่อบริษัทไม่สำเร็จ: เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ",
  /** 5xx: PostgreSQL or the Neo4j half of the write broke. */
  companyDbFailed:
    "บันทึกชื่อบริษัทไม่สำเร็จ: ฐานข้อมูลมีปัญหา กรุณาลองใหม่อีกครั้ง",
  companyNotFound: "บันทึกผู้ประสานงานแล้ว แต่ไม่พบบริษัทของกลุ่มนี้ในฐานข้อมูล",
  /** API answered 404: no Company node carries this group_id. */
  coordinatorGroupNotMatched:
    "บันทึกข้อมูลไม่สำเร็จ: ไม่พบบริษัทของกลุ่มนี้ในฐานข้อมูล กรุณาเพิ่มชื่อบริษัทก่อน",
  /** API answered 5xx: the Neo4j write itself failed. */
  coordinatorDbFailed:
    "บันทึกข้อมูลไม่สำเร็จ: ฐานข้อมูลมีปัญหา กรุณาลองใหม่อีกครั้ง",
  /** Never reached the API at all (network down, dev server not running). */
  coordinatorNetworkFailed:
    "บันทึกข้อมูลไม่สำเร็จ: เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ",
  /** A /api/v1/line/* read answered 5xx: Postgres or the extraction chain broke. */
  syncServerFailed:
    "โหลดข้อมูลไม่สำเร็จ: เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง",
  /** 404: the route is not there, usually a stale API_ORIGIN or an old  */
  syncNotFound:
    "โหลดข้อมูลไม่สำเร็จ: ไม่พบปลายทาง API กรุณาตรวจสอบเวอร์ชันของเซิร์ฟเวอร์",
  /** Any other non-2xx. */
  syncFailed:
    "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  /** The read never reached the API at all. */
  syncNetworkFailed:
    "โหลดข้อมูลไม่สำเร็จ: เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ",
  // --- login ---
  /** 401: the API checked and the pair is wrong. */
  loginBadCredentials: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  /** Caught before the request goes out. */
  loginRequireFields: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
  /** 422: the body did not match what the API expects. */
  loginBadRequest: "ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่านอีกครั้ง",
  /** 5xx: Postgres or the login lookup itself broke. */
  loginServerFailed:
    "เข้าสู่ระบบไม่สำเร็จ: เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้งภายหลัง",
  /** The request never reached the API. */
  loginNetworkFailed:
    "เข้าสู่ระบบไม่สำเร็จ: เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ",
  /** Any other non-2xx. */
  loginFailed: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",

  // --- coordinator approval ---
  coordinatorApproved: "อนุมัติและบันทึกข้อมูลผู้ประสานงานเรียบร้อยแล้ว",

  // --- coordinator edit ---
  coordinatorUpdated: "แก้ไขข้อมูลผู้ประสานงานสำเร็จ",
  /** Leads every failure toast for the edit form, whatever the cause. */
  coordinatorUpdatePrefix: "แก้ไขข้อมูลผู้ประสานงานไม่สำเร็จ",
  coordinatorUpdateFailed:
    "แก้ไขข้อมูลผู้ประสานงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  coordinatorUpdateNetworkFailed:
    "แก้ไขข้อมูลผู้ประสานงานไม่สำเร็จ: เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ",
  coordinatorUpdateNotFound:
    "แก้ไขข้อมูลผู้ประสานงานไม่สำเร็จ: ไม่พบรายการนี้แล้ว กรุณากดรีเฟรช",
  coordinatorUpdateDbFailed:
    "แก้ไขข้อมูลผู้ประสานงานไม่สำเร็จ: ฐานข้อมูลมีปัญหา กรุณาลองใหม่อีกครั้ง",
  coordinatorDeclined: "ลบข้อมูลผู้ประสานงานออกจากรายการรออนุมัติแล้ว",
  coordinatorDeclineFailed: "ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",

  editCancelled: "ยกเลิกการแก้ไข ข้อมูลกลับเป็นค่าเดิม",
  noCompanyName: "<ไม่มีชื่อบริษัท>",
} as const;
