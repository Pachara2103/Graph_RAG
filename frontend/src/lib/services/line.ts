import { getJson, postJson } from "@/lib/services/http";
import type { GroupLine, UpdateInformationResponse } from "@/types";
import { coordinatorService, groupByGroupId } from "@/lib/services/coordinator";
import { mockContactList, mockGroupLine } from "@/lib/mock-data";


export const lineService = {

  getGroupLines: () => getJson<{ groups: GroupLine[] }>("/api/v1/line/groups"),
    
  updateInformation: async (): Promise<UpdateInformationResponse> => {
    const body = await postJson<{errorGroups: string[]}>("/api/v1/line/update-information", {});
    const coordinators  = await coordinatorService.getCoordinatorsByGroup()

    return {
      coordinators: coordinators ?? [],
      errorGroups: body?.errorGroups ?? [],
    }
  },

  // getGroupLines: () => getJson<{ groups: GroupLine[] }>("/api/v1/line/groups"),

  // updateInformation: async (): Promise<UpdateInformationResponse> => {
  //   const groups = mockGroupLine() 
  //   const coordinators = await mockContactList(groups)

  //   return {
  //     coordinators: coordinators ?? {},
  //     errorGroups:  [],
  //   }
  // },



};