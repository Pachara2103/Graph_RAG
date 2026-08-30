import { postJson, getJson, putJson } from "@/lib/services/http";
import type { Coordinator } from "@/types";


export function groupByGroupId(
  list: Coordinator[],
): Record<string, Coordinator[]> {
  const byGroup: Record<string, Coordinator[]> = {};
  for (const person of list) {
    (byGroup[person.groupId] ??= []).push(person);
  }
  return byGroup;
}


export const coordinatorService = {

  getCoordinatorsByGroup: async (): Promise<Record<string, Coordinator[]>> => {
    const body = await getJson<{ coordinators: Coordinator[] }>(
      `/api/v1/coordinators`,
    );
    return groupByGroupId(body?.coordinators ?? []);
  },

  approve: (coordinatorId: number) =>
    postJson<{status: string}>(`/api/v1/coordinators/${coordinatorId}/approve`, {}),

  decline: (coordinatorId: number) =>
    postJson<{status: string}>(`/api/v1/coordinators/${coordinatorId}/decline`, {}),

  /**
   * updatedAt is dropped rather than forwarded: the column is set to
   * CURRENT_TIMESTAMP by the UPDATE itself, and the schema types the field as a
   * plain datetime, so a row that has never been touched would send null and
   * come back 422.
   */
  update: ({ updatedAt: _serverOwned, ...payload }: Coordinator) =>
    putJson<{status: string}>(`/api/v1/coordinators/${payload.id}`, payload),
};
