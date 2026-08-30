"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/icons";
import { Alert } from "@/components/ui/Alert";
import { Button, CloseButton } from "@/components/ui/Button";
import { FieldLabel, SearchInput, TextField } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MESSAGES } from "@/lib/constants";
import { searchCompanies, type CompanyOption } from "@/lib/mock-data";
import { cn, hasCompanyName } from "@/lib/utils";
import { useConsole } from "@/store/console-store";
import type { GroupLine } from "@/types";

type Mode = "add" | "search";

const MODES: { value: Mode; label: string }[] = [
  { value: "add", label: "เพิ่มชื่อบริษัทใหม่" },
  { value: "search", label: "ค้นหาบริษัทที่มีอยู่" },
];

/**
 * Replaces the body of a group card while it is open. Both modes share the
 * same validation rule: at least one of the two company names.
 */
export function CompanyForm({ group }: { group: GroupLine }) {
  const { updateCompany, createCompany, closeCompanyForm, notify } =
    useConsole();

  const [mode, setMode] = useState<Mode>("add");
  const [companyTh, setCompanyTh] = useState(group.companyTh ?? "");
  const [companyEn, setCompanyEn] = useState(group.companyEn ?? "");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<CompanyOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const results = useMemo(() => searchCompanies(term), [term]);

  async function handleConfirm() {
    if (saving) return;

    const draft =
      mode === "add"
        ? { companyTh, companyEn }
        : {
            companyTh: selected?.companyTh ?? "",
            companyEn: selected?.companyEn ?? "",
          };

    if (!hasCompanyName(draft)) {
      setError(MESSAGES.requireCompanyName);
      return;
    }

    const th = draft.companyTh.trim() || null;
    const en = draft.companyEn.trim() || null;

    // Read before the save, because a successful write flips the flag: the
    // group was either already bound to a company (so this is a rename) or it
    // was not (so this is the binding itself), and the toast has to say which.
    const wasMatched = group.isCompanyMatched;

    // "เพิ่มชื่อบริษัทใหม่" creates the company; picking one out of the database only
    // renames what the group is already bound to.
    const write = mode === "add" ? createCompany : updateCompany;

    // The write is async: only announce success once it resolves, otherwise
    // the failure toast lands on top of a bogus success toast.
    setSaving(true);
    try {
      const saved = await write(group.id, th, en);
      if (!saved) return; // the store already raised the error toast
      notify({
        kind: "success",
        message: wasMatched
          ? `แก้ไขชื่อบริษัทกลุ่ม ${group.displayName} สำเร็จ`
          : `ผูก ${group.displayName} กับ ${th ?? en} เรียบร้อย`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <Icon name="pencil" className="size-4 text-violet-400" />
          แก้ไขข้อมูลกลุ่ม:{" "}
          <span className="text-violet-300">{group.displayName}</span>
        </h3>
        <CloseButton onClick={closeCompanyForm} />
      </div>

      <SegmentedControl
        className="mt-3.5"
        value={mode}
        onChange={(next) => {
          setMode(next);
          setError(null);
        }}
        options={MODES}
      />

      {mode === "add" ? (
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <TextField
            label="ชื่อบริษัท (TH)"
            value={companyTh}
            placeholder="เช่น เอ็มเทค อินโนเวชัน จำกัด"
            onChange={(event) => {
              setCompanyTh(event.target.value);
              setError(null);
            }}
          />
          <TextField
            label="ชื่อบริษัท (EN)"
            value={companyEn}
            placeholder="e.g. M-Tech Innovation Co., Ltd."
            onChange={(event) => {
              setCompanyEn(event.target.value);
              setError(null);
            }}
          />
        </div>
      ) : (
        <div className="mt-4">
          <FieldLabel>ค้นหาบริษัทในฐานข้อมูล</FieldLabel>
          <SearchInput
            size="sm"
            value={term}
            placeholder="พิมพ์ชื่อบริษัทเพื่อค้นหา..."
            onValueChange={(next) => {
              setTerm(next);
              setSelected(null);
              setError(null);
            }}
            onClear={() => {
              setTerm("");
              setSelected(null);
            }}
          />

          {term.trim() !== "" && (
            <ul className="mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
              {results.length === 0 && (
                <li className="px-3.5 py-3 text-sm text-slate-500">
                  ไม่พบบริษัทที่ตรงกับคำค้น — สลับไปโหมด “เพิ่มชื่อบริษัทใหม่”
                  เพื่อสร้างใหม่
                </li>
              )}
              {results.map((company) => {
                const active =
                  selected?.companyEn === company.companyEn &&
                  selected?.companyTh === company.companyTh;
                return (
                  <li key={`${company.companyEn}-${company.companyTh}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(company);
                        setError(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-slate-800 px-3.5 py-2.5 text-left text-sm transition last:border-b-0",
                        active
                          ? "bg-violet-500/10 text-slate-100"
                          : "text-slate-300 hover:bg-slate-800/60",
                      )}
                    >
                      <Icon
                        name="building"
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-violet-400" : "text-slate-600",
                        )}
                      />
                      <span className="truncate">
                        {company.companyEn ?? "<ไม่มีชื่อภาษาอังกฤษ>"}
                        <span className="text-slate-600">
                          , {company.companyTh ?? "<ไม่มีชื่อภาษาไทย>"}
                        </span>
                      </span>
                      {active && (
                        <Icon
                          name="check"
                          className="ml-auto size-4 shrink-0 text-violet-400"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <Alert tone="error" title={error} className="mt-3.5" />}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button
          variant="primary"
          icon="check"
          loading={saving}
          onClick={handleConfirm}
        >
          {saving ? "กำลังบันทึก..." : "ยืนยัน"}
        </Button>
        <Button disabled={saving} onClick={closeCompanyForm}>
          ยกเลิก
        </Button>
        <p className="w-full text-[11px] text-slate-500 sm:ml-2 sm:w-auto">
          {mode === "add"
            ? "กรอกอย่างน้อยหนึ่งช่อง — ช่องที่เว้นว่างจะไม่ทับค่าเดิม"
            : "เลือกหนึ่งรายการจากผลค้นหาก่อนกดยืนยัน"}
        </p>
      </div>
    </div>
  );
}
