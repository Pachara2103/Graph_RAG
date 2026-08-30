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

/**
 * The mock the console ran on before update_information existed. Nothing calls
 * it now; keep it for working offline — point sync("all") here and it fills
 * every group the real fetchGroupLines() just returned.
 */
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
