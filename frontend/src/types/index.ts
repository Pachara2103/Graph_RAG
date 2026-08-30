export interface GroupLine {
  id: string;
  displayName: string;
  companyTh: string | null;
  companyEn: string | null;
  isCompanyMatched: boolean;
  updatedAt: string | null;
}

export type ContactStatus = "pending" | "approved" | "declined" | "failed";

export type CoordinatorField =
  | "nameTh"
  | "nameEn"
  | "nickname"
  | "jobTitle"
  | "phone"
  | "email"
  | "relevant";

export type CoordinatorDraft = Record<CoordinatorField, string>;

export interface Coordinator extends Record<CoordinatorField, string | null> {
  id: number;
  groupId: string;
  status: ContactStatus;
  updatedAt: string | null;
}
export interface UpdateInformationResponse {
  coordinators: Record<string, Coordinator[]>;
  errorGroups: string[]
}

export type SortOption =
  | "time-desc"
  | "time-asc"
  | "group-name"
  | "company-th"
  | "company-en";

export type PanelKey = "contacts" | "groups" | "library";

export interface CompanyInput {
  companyTh: string;
  companyEn: string;
}

export interface Company {
  groupId: string;
  companyTh: string | null;
  companyEn: string | null;
}



