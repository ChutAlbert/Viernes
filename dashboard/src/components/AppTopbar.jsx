import { TopbarShell } from "@viernes/ui/react";

export default function AppTopbar() {
  return (
    <TopbarShell
      left={<div className="font-semibold">Dashboard</div>}
      center={
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Search..."
        />
      }
      right={<div>Usuario</div>}
    />
  );
}