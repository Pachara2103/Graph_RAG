import { lineService } from "@/lib/services/line";
import type { Coordinator, GroupLine, UpdateInformationResponse } from "@/types";


const COMPANY_DIRECTORY = [
  { companyTh: "ลาเทค จำกัด", companyEn: "Latech Co., Ltd." },
  { companyTh: "ลาเทค ดิจิทัล จำกัด", companyEn: "Latech Digital Co., Ltd." },
  { companyTh: null, companyEn: "Latech Service" },
  { companyTh: "สยามเทค โซลูชันส์ จำกัด", companyEn: "Siam Tech Solutions Co., Ltd." },
  { companyTh: "เอ็มเทค อินโนเวชัน จำกัด", companyEn: "M-Tech Innovation Co., Ltd." },
  { companyTh: "เน็กซ์ลิงก์ จำกัด", companyEn: "NextLink Co., Ltd." },
  { companyTh: "แมวดำ จำกัด มหาชน", companyEn: null },
  { companyTh: "ไทยเบฟ ดิจิทัล จำกัด", companyEn: "ThaiBev Digital Co., Ltd." },
];

export type CompanyOption = (typeof COMPANY_DIRECTORY)[number];

export async function fetchGroupLines(): Promise<GroupLine[]> {
  const data = await lineService.getGroupLines();

  // const data = {
  //   groups: mockGroupLine(),
  // };

  return data.groups;
}

/**
 * Stand-in coordinators, dealt out over whatever groups the real read just
 * returned so the keys always line up with fetchGroupLines().
 *
 * Sizes cycle rather than being random: a re-sync has to produce the same list,
 * and the 0 leaves some groups with no pending rows, which is what the real
 * endpoint does for groups with no unread messages.
 */
const MOCK_SIZES = [2, 1, 3, 0];

const MOCK_PEOPLE: Omit<Coordinator, "id" | "groupId">[] = [
  {
    nameTh: "พชร อุ้ยกิ้ม",
    nameEn: "Pachara Auikim",
    nickname: "บาส",
    jobTitle: "HR",
    phone: "012-345-6789",
    email: "bas@latech.com",
    relevant: "MOU",
    status: "pending",
    updatedAt: null,
  },
  {
    nameTh: "สุภาพร วงศ์ไทย",
    nameEn: "Supaporn Wongthai",
    nickname: "พร",
    jobTitle: "Talent Acquisition Lead",
    phone: "02-118-4400",
    email: "supaporn@latech.com",
    relevant: "สหกิจศึกษา",
    status: "pending",
    updatedAt: null,
  },
  {
    nameTh: "ณัฐพงษ์ ศรีสุข",
    nameEn: "Nattapong Srisuk",
    nickname: "เอ็ม",
    jobTitle: "HR Business Partner",
    phone: "081-234-5678",
    email: "nattapong@siamtech.co.th",
    relevant: "ฝึกงาน",
    status: "pending",
    updatedAt: null,
  },
  {
    nameTh: "กมลชนก ปิติกุล",
    nameEn: "Kamonchanok Pitikul",
    nickname: null,
    jobTitle: "Recruiter",
    phone: null,
    email: "kamonchanok@siamtech.co.th",
    relevant: "วิชาเลือก",
    status: "pending",
    updatedAt: null,
  },
  {
    nameTh: null,
    nameEn: "Daniel Reyes",
    nickname: "Dan",
    jobTitle: "Engineering Manager",
    phone: "02-555-0180",
    email: null,
    relevant: null,
    status: "pending",
    updatedAt: null,
  },
  {
    nameTh: "อรุณี ทองแท้",
    nameEn: "Arunee Thongtae",
    nickname: "หน่อย",
    jobTitle: "People Operations",
    phone: "089-777-1212",
    email: "arunee@mtech.co.th",
    relevant: "สหกิจศึกษา",
    status: "pending",
    updatedAt: null,
  },
  {
    nameTh: "ธนกร พูลสวัสดิ์",
    nameEn: null,
    nickname: null,
    jobTitle: null,
    phone: "086-111-2233",
    email: null,
    relevant: null,
    status: "pending",
    updatedAt: null,
  },
];

function mockContactsFor(groups: GroupLine[]): Record<string, Coordinator[]> {
  const contacts: Record<string, Coordinator[]> = {};
  let person = 0;
  let id = 1;

  groups.forEach((group, index) => {
    const take = MOCK_SIZES[index % MOCK_SIZES.length];
    if (take === 0) return;
    contacts[group.id] = Array.from({ length: take }, () => ({
      ...MOCK_PEOPLE[person++ % MOCK_PEOPLE.length],
      id: id++,
      groupId: group.id,
    }));
  });

  return contacts;
}

export function updateInformation(): Promise<UpdateInformationResponse> {
  return lineService.updateInformation();
}


export async function mockContactList(
  groups: GroupLine[],
): Promise<Record<string, Coordinator[]>> {
  return mockContactsFor(groups);
}

export function searchCompanies(term: string): CompanyOption[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  
  return COMPANY_DIRECTORY.filter((c) =>
    [c.companyTh, c.companyEn].some((name) =>
      (name ?? "").toLowerCase().includes(needle),
    ),
  );
}


export const mockGroupLine = (): GroupLine[] => {
  const groups: GroupLine[] = [
    // --- 10 กลุ่มที่ isCompanyMatched = true ---
    {
      id: "grp_001",
      displayName: "LINE Group - PTT Public",
      companyTh: "บริษัท ปตท. จำกัด (มหาชน)",
      companyEn: "PTT Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-30T10:00:00Z",
    },
    {
      id: "grp_002",
      displayName: "LINE Group - SCG Corp",
      companyTh: "บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)",
      companyEn: "The Siam Cement Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-29T14:30:00Z",
    },
    {
      id: "grp_003",
      displayName: "LINE Group - CP All",
      companyTh: "บริษัท ซีพี ออลล์ จำกัด (มหาชน)",
      companyEn: "CP ALL Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-28T09:15:00Z",
    },
    {
      id: "grp_004",
      displayName: "LINE Group - AIS Official",
      companyTh: "บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)",
      companyEn: "Advanced Info Service Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-27T16:45:00Z",
    },
    {
      id: "grp_005",
      displayName: "LINE Group - KBANK Connect",
      companyTh: "ธนาคารกสิกรไทย จำกัด (มหาชน)",
      companyEn: "Kasikornbank Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-26T11:20:00Z",
    },
    {
      id: "grp_006",
      displayName: "LINE Group - SCB Tech",
      companyTh: "ธนาคารไทยพาณิชย์ จำกัด (มหาชน)",
      companyEn: "The Siam Commercial Bank Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-25T08:00:00Z",
    },
    {
      id: "grp_007",
      displayName: "LINE Group - Central Pattana",
      companyTh: "บริษัท เซ็นทรัลพัฒนา จำกัด (มหาชน)",
      companyEn: "Central Pattana Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-24T13:10:00Z",
    },
    {
      id: "grp_008",
      displayName: "LINE Group - Gulf Energy",
      companyTh: "บริษัท กัลฟ์ เอ็นเนอร์จี ดีเวลลอปเมนท์ จำกัด (มหาชน)",
      companyEn: "Gulf Energy Development Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-23T17:05:00Z",
    },
    {
      id: "grp_009",
      displayName: "LINE Group - True Corp",
      companyTh: "บริษัท ทรู คอร์ปอเรชั่น จำกัด (มหาชน)",
      companyEn: "True Corporation Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-22T15:40:00Z",
    },
    {
      id: "grp_010",
      displayName: "LINE Group - ThaiBev",
      companyTh: "บริษัท ไทยเบฟเวอเรจ จำกัด (มหาชน)",
      companyEn: "Thai Beverage Public Company Limited",
      isCompanyMatched: true,
      updatedAt: "2026-08-21T12:00:00Z",
    },

    // --- 10 กลุ่มที่ isCompanyMatched = false ---
    {
      id: "grp_011",
      displayName: "LINE Group - General Discussion",
      companyTh: null,
      companyEn: null,
      isCompanyMatched: false,
      updatedAt: null,
    },
    {
      id: "grp_012",
      displayName: "LINE Group - Sales Lead 2026",
      companyTh: "บริษัท เซลส์พลัส จำกัด",
      companyEn: null,
      isCompanyMatched: false,
      updatedAt: "2026-08-20T10:00:00Z",
    },
    {
      id: "grp_013",
      displayName: "LINE Group - Tech Project",
      companyTh: null,
      companyEn: "Tech Solution Co., Ltd.",
      isCompanyMatched: false,
      updatedAt: "2026-08-19T14:20:00Z",
    },
    {
      id: "grp_014",
      displayName: "LINE Group - Marketing Team",
      companyTh: null,
      companyEn: null,
      isCompanyMatched: false,
      updatedAt: null,
    },
    {
      id: "grp_015",
      displayName: "LINE Group - Vendor A",
      companyTh: "บริษัท ซัพพลายเออร์ A จำกัด",
      companyEn: null,
      isCompanyMatched: false,
      updatedAt: "2026-08-18T16:00:00Z",
    },
    {
      id: "grp_016",
      displayName: "LINE Group - Client Support",
      companyTh: null,
      companyEn: "Global Support Inc.",
      isCompanyMatched: false,
      updatedAt: "2026-08-17T09:30:00Z",
    },
    {
      id: "grp_017",
      displayName: "LINE Group - Pending Verification",
      companyTh: "บริษัท รอตรวจสอบ จำกัด",
      companyEn: "Pending Verification Co., Ltd.",
      isCompanyMatched: false,
      updatedAt: "2026-08-16T11:45:00Z",
    },
    {
      id: "grp_018",
      displayName: "LINE Group - Event Coordinators",
      companyTh: null,
      companyEn: null,
      isCompanyMatched: false,
      updatedAt: null,
    },
    {
      id: "grp_019",
      displayName: "LINE Group - Logistics Chat",
      companyTh: "บริษัท ขนส่งไทย จำกัด",
      companyEn: null,
      isCompanyMatched: false,
      updatedAt: "2026-08-15T13:50:00Z",
    },
    {
      id: "grp_020",
      displayName: "LINE Group - Unknown Partner",
      companyTh: null,
      companyEn: null,
      isCompanyMatched: false,
      updatedAt: null,
    },
  ];

  return groups
};