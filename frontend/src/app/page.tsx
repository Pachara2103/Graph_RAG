import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function Home() {
  return (
    <RequireAuth>
      <ConsoleShell />
    </RequireAuth>
  );
}
