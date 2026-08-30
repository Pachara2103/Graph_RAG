"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState, GroupCardSkeleton } from "@/components/ui/EmptyState";
import {
  SearchInput,
  SelectField,
  TextField,
} from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MESSAGES, RELEVANT_OPTIONS } from "@/lib/constants";

/**
 * Every state the two working panels can reach, side by side. Handy while
 * building Figma components and as a regression surface for the design tokens.
 */
export function LibraryPanel() {
  const [mode, setMode] = useState<"add" | "search">("add");
  const [page, setPage] = useState(2);
  const [term, setTerm] = useState("latech");

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
          คลังสถานะ &amp; Component
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          สถานะทั้งหมดที่ต้องมีใน Figma — Empty, Loading, Alert, Badge, Button, Input
        </p>
      </header>

      <Group title="Empty states">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <EmptyState
            icon="inbox"
            title="ยังไม่มีรายการ"
            detail="กด อัปเดตข้อมูล เพื่อให้ AI ดึงและสรุปข้อมูลจากกลุ่มไลน์"
            action={
              <Button variant="primary" icon="sparkles">
                อัปเดตข้อมูล
              </Button>
            }
          />
          <EmptyState
            icon="search"
            title="ไม่พบรายการที่ค้นหา"
            detail="ลองใช้คำสั้นลง หรือค้นด้วยชื่อบริษัทภาษาอังกฤษแทน"
            action={<Button>ล้างคำค้น</Button>}
          />
          <EmptyState
            icon="unlink"
            title="ยังไม่มีกลุ่มไลน์ที่ผูกบริษัท"
            detail="เริ่มจากผูกบริษัทให้กลุ่มในรายการด้านล่าง"
          />
          <EmptyState
            icon="check-circle"
            tone="success"
            title="ผูกบริษัทครบทุกกลุ่มไลน์แล้ว"
            detail="ไม่มีกลุ่มที่ค้างอยู่ในคิว"
          />
        </div>
      </Group>

      <Group title="Alerts & feedback">
        <div className="space-y-2.5">
          <Alert tone="success" title="บันทึกข้อมูลคุณ พชร อุ้ยกิ้ม แล้ว" />
          <Alert
            tone="error"
            title={MESSAGES.requireCoordinatorName}
            onDismiss={() => undefined}
          />
          <Alert tone="warn" title={MESSAGES.companyNotFound} />
          <Alert
            tone="loading"
            title="กำลังวิเคราะห์ข้อมูล..."
            trailing={
              <div className="ml-auto hidden h-1 w-32 overflow-hidden rounded-full bg-slate-700 sm:block">
                <div className="h-full w-2/5 rounded-full bg-violet-500" />
              </div>
            }
          />
          <Alert tone="info" title={MESSAGES.editCancelled} />
        </div>
      </Group>

      <Group title="Loading skeleton">
        <div className="space-y-2.5">
          <GroupCardSkeleton />
          <GroupCardSkeleton />
        </div>
      </Group>

      <Group title="Badges">
        <Panel>
          <div className="flex flex-wrap gap-2.5">
            <Badge tone="matched" dot>
              ผูกบริษัทแล้ว
            </Badge>
            <Badge tone="unmatched" dot>
              ยังไม่ได้ผูกบริษัท
            </Badge>
            <Badge tone="pending">รอยืนยัน</Badge>
            <Badge tone="completed">บันทึกแล้ว</Badge>
            <Badge tone="unmatched">ข้อมูลไม่ครบ 2 ช่อง</Badge>
            {RELEVANT_OPTIONS.slice(1).map((option) => (
              <Badge key={option} tone="neutral">
                {option}
              </Badge>
            ))}
            <Badge tone="muted">ไม่มีข้อมูล</Badge>
          </div>
        </Panel>
      </Group>

      <Group title="Buttons">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="warn" icon="plus">
              Primary · warn
            </Button>
            <Button>Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <IconButton icon="pencil" label="แก้ไข" />
            <Button disabled>Disabled</Button>
            <Button variant="primary" loading>
              กำลังบันทึก
            </Button>
          </div>
        </Panel>
      </Group>

      <Group title="Inputs">
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Default" placeholder="พิมพ์ข้อความ..." />
            <TextField label="Filled" defaultValue="พชร อุ้ยกิ้ม" />
            <TextField
              label="With hint"
              defaultValue="012-345-6789"
              mono
              hint="ไม่มีการตรวจรูปแบบเบอร์โทร"
            />
            <TextField label="Error" error={MESSAGES.requireCoordinatorName} />
            <SelectField
              label="Select"
              options={RELEVANT_OPTIONS}
              defaultValue={RELEVANT_OPTIONS[1]}
            />
            <TextField label="Disabled" defaultValue="แก้ไขไม่ได้" disabled />
            <div className="sm:col-span-2">
              <SearchInput
                value={term}
                onValueChange={setTerm}
                onClear={() => setTerm("")}
                placeholder="ค้นหาด้วยชื่อกลุ่มไลน์ หรือชื่อบริษัท..."
              />
            </div>
            <div className="sm:col-span-2">
              <SegmentedControl
                value={mode}
                onChange={setMode}
                options={[
                  { value: "add", label: "เพิ่มชื่อบริษัทใหม่" },
                  { value: "search", label: "ค้นหาบริษัทที่มีอยู่" },
                ]}
              />
            </div>
          </div>
        </Panel>
      </Group>

      <Group title="Pagination">
        <Pagination page={page} totalPages={4} onChange={setPage} />
      </Group>

      <Group title="Color tokens">
        <Panel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <Swatch swatch="bg-slate-900 border border-slate-700" name="slate-900" note="#0F172A · page" />
            <Swatch swatch="bg-slate-800 border border-slate-700" name="slate-800" note="#1E293B · card" />
            <Swatch swatch="bg-slate-700 border border-slate-600" name="slate-700" note="#334155 · border" />
            <Swatch swatch="bg-violet-600" name="violet-600" note="#7C3AED · accent" />
            <Swatch swatch="bg-emerald-400" name="emerald-400" note="#34D399 · matched" />
            <Swatch swatch="bg-amber-400" name="amber-400" note="#FBBF24 · unmatched" />
          </div>
        </Panel>
      </Group>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="font-mono text-[10px] tracking-[0.16em] text-slate-500 uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-800/20 p-5">
      {children}
    </div>
  );
}

function Swatch({
  swatch,
  name,
  note,
}: {
  swatch: string;
  name: string;
  note: string;
}) {
  return (
    <div>
      <div className={`h-14 rounded-xl ${swatch}`} />
      <p className="mt-1.5 font-mono text-[11px] text-slate-300">{name}</p>
      <p className="font-mono text-[10px] text-slate-600">{note}</p>
    </div>
  );
}
