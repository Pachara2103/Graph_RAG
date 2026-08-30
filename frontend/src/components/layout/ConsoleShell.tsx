"use client";

import { useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { ToastHost } from "@/components/layout/ToastHost";
import { Topbar } from "@/components/layout/Topbar";
import { ContactsPanel } from "@/components/panels/ContactsPanel";
import { GroupsPanel } from "@/components/panels/GroupsPanel";
import { LibraryPanel } from "@/components/panels/LibraryPanel";
import { ConsoleProvider } from "@/store/console-store";
import type { PanelKey } from "@/types";

const PANELS: Record<PanelKey, () => React.ReactElement> = {
  contacts: ContactsPanel,
  groups: GroupsPanel,
  library: LibraryPanel,
};

export function ConsoleShell() {
  const [panel, setPanel] = useState<PanelKey>("contacts");
  const Panel = PANELS[panel];

  function navigate(next: PanelKey) {
    setPanel(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ConsoleProvider>
      {/* ambient glow behind the header, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[380px] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(139,92,246,0.14),transparent_70%)]"
      />

      <div className="relative flex min-h-screen">
        <Sidebar active={panel} onNavigate={navigate} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar and the notification slot stick together, so the toast
              always rides just under the bar wherever the page is scrolled. */}
          <div className="sticky top-0 z-30">
            <Topbar active={panel} onNavigate={navigate} />
            <ToastHost />
          </div>

          <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-7 sm:px-8">
            <Panel />
          </main>

          <footer className="border-t border-slate-800 px-5 py-6 sm:px-8">
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-slate-600">
              <span>NextLink AI · Coordinator Console</span>
              <span>Next.js · TypeScript · Tailwind CSS</span>
              {/* <span className="ml-auto">ข้อมูลตัวอย่างจาก src/lib/mock-data.ts</span> */}
            </div>
          </footer>
        </div>
      </div>
    </ConsoleProvider>
  );
}
