import { Outlet } from "react-router-dom";
import { Drawer } from "@viernes/ui/react";
import { useState } from "react";
import AppSidebar from "@components/AppSidebar";
import AppTopbar from "@components/AppTopbar";

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--c-bg)" }}>
      {/* Mobile drawer */}
      <Drawer open={open} onClose={() => setOpen(false)}>
        <div className="w-64 h-full">
          <AppSidebar />
        </div>
      </Drawer>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0 h-full">
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
