import { postJson, putJson } from "@/lib/services/http";
import {Company} from "@/types";

export const companyService = {

  update: (payload: Company) =>
    putJson<{ status: string }>(`/api/v1/companies/${payload.groupId}`, 
      {
        "companyTh": payload.companyTh, 
        "companyEn": payload.companyEn
      }),

  create: (payload: Company) =>
    postJson<{ status: string }>(`/api/v1/companies/${payload.groupId}`, 
      {
        "companyTh": payload.companyTh, 
        "companyEn": payload.companyEn
      }),
};
