import { Outlet } from "react-router-dom";
import { useState } from "react";
import AppSidebar from "@components/AppSidebar";
import AppTopbar from "@components/AppTopbar";

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--c-bg)" }}>
      {/* Mobile drawer — propio, a ras y temado */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[312px] max-w-[85vw] shadow-2xl">
            <AppSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-[312px] flex-shrink-0 h-full">
        <div className="w-full h-full">
          <AppSidebar />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AppTopbar onOpenSidebar={() => setOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6" style={{ background: "var(--c-bg)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
