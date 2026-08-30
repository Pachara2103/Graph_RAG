"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { MESSAGES } from "@/lib/constants";
import { updateInformation, fetchGroupLines } from "@/lib/mock-data";
import type {
  Company,
  ContactStatus,
  Coordinator,
  GroupLine,
  PanelKey,
} from "@/types";

import { companyService } from "@/lib/services/company";
import { coordinatorService } from "@/lib/services/coordinator";
import { isNetworkError, serverDetail } from "@/lib/services/errors";
import { ApiError } from "@/lib/services/http";

/**
 * Client-side replacement for the Streamlit st.session_state. Every "index" key
 * in the original held a single value, so at most one group is expanded, one
 * contact is in edit mode, and one company form is open at a time. That is kept
 * deliberately, with one fix: the open company form is scoped to a panel, so
 * switching panels no longer tears down what the other one had open.
 */

export type Toast = {
  kind: "info" | "warn" | "error" | "success";
  message: string;
};

/**
 * "groups" and "all" are the two buttons in the topbar. "initial" is the mount
 * read: it pulls both cheap endpoints at once so a fresh login already shows
 * the coordinators left over from the last session, without paying for the LLM
 * pass that "all" runs.
 */
export type SyncScope = "all" | "groups" | "initial";

interface State {
  groupLines: GroupLine[];
  contacts: Record<string, Coordinator[]>;
  syncing: null | SyncScope;
  lastSyncedAt: string | null;
  viewingGroupId: string | null;
  editingContactId: number | null;
  editingCompany: { scope: PanelKey; groupId: string } | null;
  toast: Toast | null;
}

type Action =
  | { type: "sync/start"; scope: SyncScope }
  | {
      type: "sync/done";
      scope: SyncScope;
      groups: GroupLine[];
      contacts: Record<string, Coordinator[]>;
      at: string;
    }
  | { type: "view/toggle"; groupId: string }
  | { type: "contact/edit"; contactId: number }
  | { type: "contact/edit-cancel" }
  | {
      type: "contact/save";
      groupId: string;
      contactId: number;
      patch: Record<string, string | null>;
    }
  | { type: "contact/confirm"; groupId: string; contactId: number; at: string }
  | { type: "contact/decline"; groupId: string; contactId: number; at: string }
  | { type: "company/open"; scope: PanelKey; groupId: string }
  | { type: "company/close" }
  | {
      type: "company/save";
      groupId: string;
      companyTh: string | null;
      companyEn: string | null;
      at: string;
    }
  | { type: "sync/failed"; message: string }
  | { type: "toast/set"; toast: Toast }
  | { type: "toast/clear" };

// Both reads are async now, so the console starts empty and the provider
// kicks off the initial sync on mount.
function initialState(): State {
  return {
    groupLines: [],
    contacts: {},
    syncing: "initial",
    lastSyncedAt: null,
    viewingGroupId: null,
    editingContactId: null,
    editingCompany: null,
    toast: null,
  };
}

function mapContacts(
  contacts: Record<string, Coordinator[]>,
  groupId: string,
  contactId: number,
  update: (person: Coordinator) => Coordinator,
): Record<string, Coordinator[]> {
  const list = contacts[groupId];
  if (!list) return contacts;
  return {
    ...contacts,
    [groupId]: list.map((person) =>
      person.id === contactId ? update(person) : person,
    ),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "sync/start":
      return { ...state, syncing: action.scope, toast: null };

    // A sync closes everything that was open, exactly like the original reruns.
    case "sync/done":
      return {
        ...state,
        syncing: null,
        lastSyncedAt: action.at,

        // Each scope only overwrites what it actually read, so a "groups"
        // refresh cannot wipe the contacts and vice versa.
        groupLines:
          action.scope === "all" ? state.groupLines : action.groups,
        contacts:
          action.scope === "groups" ? state.contacts : action.contacts,

        viewingGroupId: null,
        editingContactId: null,
        editingCompany: null,
      };

    case "view/toggle":
      return {
        ...state,
        viewingGroupId:
          state.viewingGroupId === action.groupId ? null : action.groupId,
        editingContactId: null,
      };

    case "contact/edit":
      return { ...state, editingContactId: action.contactId, toast: null };

    case "contact/edit-cancel":
      return {
        ...state,
        editingContactId: null,
        toast: { kind: "info", message: MESSAGES.editCancelled },
      };

    // Saving the form only mutates local state. The graph write happens on
    // confirm, which is why the two buttons carry different labels.
    case "contact/save":
      return {
        ...state,
        editingContactId: null,
        toast: null,
        contacts: mapContacts(
          state.contacts,
          action.groupId,
          action.contactId,
          (person) => ({ ...person, ...action.patch }) as Coordinator,
        ),
      };

    case "contact/confirm":
      return {
        ...state,
        toast: { kind: "success", message: MESSAGES.coordinatorApproved },
        contacts: mapContacts(
          state.contacts,
          action.groupId,
          action.contactId,
          (person) => ({ ...person, status: "approved", updatedAt: action.at }),
        ),
      };

    // A decline is not a delete: the row stays in approval_logs, it just leaves
    // the รออนุมัติ list. Mirroring that here keeps the tab counts honest
    // without another round trip.
    case "contact/decline":
      return {
        ...state,
        toast: { kind: "info", message: MESSAGES.coordinatorDeclined },
        contacts: mapContacts(
          state.contacts,
          action.groupId,
          action.contactId,
          (person) => ({ ...person, status: "declined", updatedAt: action.at }),
        ),
      };

    case "company/open":
      return {
        ...state,
        editingCompany: { scope: action.scope, groupId: action.groupId },
        // the original collapsed the expanded group whenever a form opened
        viewingGroupId:
          state.viewingGroupId === action.groupId ? null : state.viewingGroupId,
      };

    case "company/close":
      return { ...state, editingCompany: null };

    // A blank field does not overwrite an existing name, matching the coalesce
    // in the Cypher MERGE.
    case "company/save":
      return {
        ...state,
        editingCompany: null,
        groupLines: state.groupLines.map((group) =>
          group.id === action.groupId
            ? {
                ...group,
                companyTh: action.companyTh ?? group.companyTh,
                companyEn: action.companyEn ?? group.companyEn,
                isCompanyMatched: true,
                updatedAt: action.at,
              }
            : group,
        ),
      };

    case "sync/failed":
      return {
        ...state,
        syncing: null,
        toast: { kind: "error", message: action.message },
      };

    case "toast/set":
      return { ...state, toast: action.toast };

    case "toast/clear":
      return { ...state, toast: null };

    default:
      return state;
  }
}

interface Store extends State {
  matchedGroups: GroupLine[];
  unmatchedGroups: GroupLine[];
  pendingCount: number;
  completedCount: number;
  /** One count per approval_logs status, for the filter tabs. */
  statusCounts: Record<ContactStatus, number>;
  isCompanyFormOpen: (scope: PanelKey, groupId: string) => boolean;
  sync: (scope: SyncScope) => Promise<void>;
  toggleView: (groupId: string) => void;
  startContactEdit: (contactId: number) => void;
  cancelContactEdit: () => void;
  /**
   * Writes the edited fields through the API. Resolves true only when the row
   * really changed; on failure nothing is touched locally and the form stays
   * open on the values the user typed, so the save can be retried.
   */
  saveContact: (
    groupId: string,
    contactId: number,
    patch: Record<string, string | null>,
  ) => Promise<boolean>;
  confirmContact: (groupId: string, contactId: number) => Promise<void>;
  /** Declines one extracted coordinator — writes nothing to the graph. */
  declineContact: (groupId: string, contactId: number) => Promise<void>;
  openCompanyForm: (scope: PanelKey, groupId: string) => void;
  closeCompanyForm: () => void;
  /** Renames the company a group is already bound to. True only on success. */
  updateCompany: (
    groupId: string,
    companyTh: string | null,
    companyEn: string | null,
  ) => Promise<boolean>;
  /** Creates the company and binds the group to it. True only on success. */
  createCompany: (
    groupId: string,
    companyTh: string | null,
    companyEn: string | null,
  ) => Promise<boolean>;
  notify: (toast: Toast) => void;
  clearToast: () => void;
}

/**
 * Every toast below follows the same three steps, because the backend now
 * raises core.exceptions.AppException and its message is written for this
 * screen: no answer at all is a network problem we name ourselves, an answer
 * carrying a detail gets that detail shown verbatim under our own prefix, and
 * only an answer with nothing usable in it falls back to the status code.
 */
function syncErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return MESSAGES.syncNetworkFailed;

  const detail = serverDetail(error);
  if (detail) return `${MESSAGES.syncPrefix}: ${detail}`;

  const { status } = error as ApiError;
  if (status >= 500) return MESSAGES.syncServerFailed;
  if (status === 404) return MESSAGES.syncNotFound;
  return MESSAGES.syncFailed;
}

function coordinatorErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return MESSAGES.coordinatorNetworkFailed;

  const detail = serverDetail(error);
  if (detail) return `${MESSAGES.coordinatorPrefix}: ${detail}`;

  const { status } = error as ApiError;
  if (status === 404) return MESSAGES.coordinatorGroupNotMatched;
  if (status >= 500) return MESSAGES.coordinatorDbFailed;
  return MESSAGES.coordinatorSaveFailed;
}

function coordinatorUpdateErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return MESSAGES.coordinatorUpdateNetworkFailed;

  const detail = serverDetail(error);
  if (detail) return `${MESSAGES.coordinatorUpdatePrefix}: ${detail}`;

  const { status } = error as ApiError;
  if (status === 404) return MESSAGES.coordinatorUpdateNotFound;
  if (status >= 500) return MESSAGES.coordinatorUpdateDbFailed;
  return MESSAGES.coordinatorUpdateFailed;
}

function declineErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return MESSAGES.coordinatorNetworkFailed;

  const detail = serverDetail(error);
  if (detail) return `${MESSAGES.declinePrefix}: ${detail}`;

  return (error as ApiError).status >= 500
    ? MESSAGES.coordinatorDbFailed
    : MESSAGES.coordinatorDeclineFailed;
}

function companyErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return MESSAGES.companyNetworkFailed;

  const detail = serverDetail(error);
  if (detail) return `${MESSAGES.companyPrefix}: ${detail}`;

  const { status } = error as ApiError;
  if (status === 400 || status === 422) return MESSAGES.requireCompanyName;
  if (status >= 500) return MESSAGES.companyDbFailed;
  return MESSAGES.companySaveFailed;
}

const ConsoleContext = createContext<Store | null>(null);


export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  // Monotonic ticket, so a slow "all" sync that lands after a later "groups"
  // sync cannot overwrite the fresher data.
  const requestId = useRef(0);

  const sync = useCallback(async (scope: SyncScope) => {
    const id = ++requestId.current;
    dispatch({ type: "sync/start", scope });
    try {
  
      let groups: GroupLine[] = [];
      let contacts: Record<string, Coordinator[]> = {};
      let errorGroups: string[] = [];

      if (scope === "all") {
        const res = await updateInformation();
        contacts = res.coordinators;
        errorGroups = res.errorGroups;
      } else if (scope === "groups") {
        groups = await fetchGroupLines();
      } else {
        // In parallel: neither read depends on the other, and the console is
        // blank until both land.
        [groups, contacts] = await Promise.all([
          fetchGroupLines(),
          coordinatorService.getCoordinatorsByGroup(),
        ]);
      }

      if (id !== requestId.current) return;

      
      dispatch({
        type: "sync/done",
        scope,
        groups,
        contacts,
        at: new Date().toISOString(),
      });

      if (errorGroups.length > 0) {
        let errorMessage = `เกิดปัญหาในการสรุปข้อมูลกลุ่ม ${errorGroups.join(", ")}`
        dispatch({ type: "toast/set", toast: { kind: "warn", message: errorMessage } });
      }

    } catch (error) {
      console.error("sync failed", error);
      if (id !== requestId.current) return;
      dispatch({ type: "sync/failed", message: syncErrorMessage(error) });
    }
  }, []);

  // First paint has nothing to show, so pull the group lines and whatever
  // coordinators are already stored. Only the LLM pass that produces new ones
  // stays behind the "อัปเดตข้อมูล" button.
  useEffect(() => {
    void sync("initial");
  }, [sync]);

  // Stable identity: ToastHost keys its 3s auto-dismiss timer off this, so it
  // must not change on every unrelated state update or the timer never fires.
  const clearToast = useCallback(() => dispatch({ type: "toast/clear" }), []);

  const value = useMemo<Store>(() => {
    const matchedGroups = state.groupLines.filter((g) => g.isCompanyMatched);
    const unmatchedGroups = state.groupLines.filter((g) => !g.isCompanyMatched);
    const everyone = Object.values(state.contacts).flat();
    const statusCounts: Record<ContactStatus, number> = {
      pending: 0,
      approved: 0,
      declined: 0,
      failed: 0,
    };
    for (const person of everyone) statusCounts[person.status] += 1;

    // The two company buttons differ only in which endpoint they hit: the
    // local state change, and the way a failure is reported, are identical.
    const writeCompany = async (
      label: string,
      write: (payload: Company) => Promise<unknown>,
      payload: Company,
    ): Promise<boolean> => {
      try {
        await write(payload);
        dispatch({
          type: "company/save",
          groupId: payload.groupId,
          companyTh: payload.companyTh,
          companyEn: payload.companyEn,
          at: new Date().toISOString(),
        });
        return true;
      } catch (error) {
        // The company write is the one place two databases are involved, so
        // "บันทึกข้อมูลไม่สำเร็จ" was never enough — which half failed, and
        // why, only the API knows.
        console.error(`${label} failed`, error);
        dispatch({
          type: "toast/set",
          toast: { kind: "error", message: companyErrorMessage(error) },
        });
        return false;
      }
    };

    return {
      ...state,
      matchedGroups,
      unmatchedGroups,
      pendingCount: statusCounts.pending,
      completedCount: statusCounts.approved,
      statusCounts,
      isCompanyFormOpen: (scope, groupId) =>
        state.editingCompany?.scope === scope &&
        state.editingCompany.groupId === groupId,
      sync,
      toggleView: (groupId) => dispatch({ type: "view/toggle", groupId }),
      startContactEdit: (contactId) =>
        dispatch({ type: "contact/edit", contactId }),
      cancelContactEdit: () => dispatch({ type: "contact/edit-cancel" }),

      saveContact: async (groupId, contactId, patch) => {
        const contact = (state.contacts[groupId] ?? []).find(
          (c) => c.id === contactId,
        );
        if (!contact) {
          dispatch({
            type: "toast/set",
            toast: { kind: "error", message: "ไม่พบข้อมูลผู้ติดต่อ" },
          });
          return false;
        }

        try {
          await coordinatorService.update({ ...contact, ...patch } as Coordinator);
        } catch (error) {
          console.error("saveContact failed", error);
          dispatch({
            type: "toast/set",
            toast: {
              kind: "error",
              message: coordinatorUpdateErrorMessage(error),
            },
          });
          return false;
        }

        // Only now, so a row the API refused keeps the values it still has.
        dispatch({ type: "contact/save", groupId, contactId, patch });
        dispatch({
          type: "toast/set",
          toast: { kind: "success", message: MESSAGES.coordinatorUpdated },
        });
        return true;
      },


      confirmContact: async (groupId, contactId) => {
        const group = state.groupLines.find((g) => g.id === groupId);
        if (group && !group.isCompanyMatched) {
          dispatch({
            type: "toast/set",
            toast: { kind: "warn", message: MESSAGES.companyNotFound },
          });
          return;
        }

        const contact = (state.contacts[groupId] ?? []).find(
          (c) => c.id === contactId,
        );
        if (!contact) {
          dispatch({
            type: "toast/set",
            toast: { kind: "error", message: "ไม่พบข้อมูลผู้ติดต่อ" },
          });
          return;
        }

        try {
          await coordinatorService.approve(contact.id);
          dispatch({
            type: "contact/confirm",
            groupId,
            contactId,
            at: new Date().toISOString(),
          });
        } catch (error) {
          console.error("confirmContact failed", error);
          dispatch({
            type: "toast/set",
            toast: { kind: "error", message: coordinatorErrorMessage(error) },
          });
        }
      },

      declineContact: async (groupId, contactId) => {
        const contact = (state.contacts[groupId] ?? []).find(
          (c) => c.id === contactId,
        );
        if (!contact) {
          dispatch({
            type: "toast/set",
            toast: { kind: "error", message: "ไม่พบข้อมูลผู้ติดต่อ" },
          });
          return;
        }

        try {
          await coordinatorService.decline(contact.id);
          dispatch({
            type: "contact/decline",
            groupId,
            contactId,
            at: new Date().toISOString(),
          });
          
        } catch (error) {
          console.error("declineContact failed", error);
          dispatch({
            type: "toast/set",
            toast: { kind: "error", message: declineErrorMessage(error) },
          });
        }
      },

      openCompanyForm: (scope, groupId) =>
        dispatch({ type: "company/open", scope, groupId }),
      closeCompanyForm: () => dispatch({ type: "company/close" }),
      
      updateCompany: (groupId, companyTh, companyEn) =>
        writeCompany("updateCompany", companyService.update, {
          groupId,
          companyTh,
          companyEn,
        }),

      createCompany: (groupId, companyTh, companyEn) =>
        writeCompany("createCompany", companyService.create, {
          groupId,
          companyTh,
          companyEn,
        }),


      notify: (toast) => dispatch({ type: "toast/set", toast }),
      clearToast,
    };
  }, [state, sync, clearToast]);

  return (
    <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
  );
}

export function useConsole(): Store {
  const store = useContext(ConsoleContext);
  if (!store) {
    throw new Error("useConsole must be used inside a ConsoleProvider");
  }
  return store;
}
