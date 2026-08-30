import { getJson } from "@/lib/services/http";
import type { GroupLine, UpdateInformationResponse } from "@/types";
import { coordinatorService, groupByGroupId } from "@/lib/services/coordinator";

export const lineService = {

  getGroupLines: () => getJson<{ groups: GroupLine[] }>("/api/v1/line/groups"),
    
  updateInformation: async (): Promise<UpdateInformationResponse> => {
    const body = await getJson<{errorGroups: string[]}>("/api/v1/line/update-information");
    const coordinators  = await coordinatorService.getCoordinatorsByGroup()

    return {
      coordinators: coordinators ?? [],
      errorGroups: body?.errorGroups ?? [],
    }
  },
};