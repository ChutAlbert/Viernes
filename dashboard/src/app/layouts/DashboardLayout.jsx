import { Outlet } from "react-router-dom";
import { AppShell, Drawer } from "@viernes/ui/react";
import { useState } from "react";
import AppSidebar from "@components/AppSidebar";
import AppTopbar from "@components/AppTopbar";

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <AppShell>
      <Drawer open={open} onClose={() => setOpen(false)}>
        <AppSidebar isMobile />
      </Drawer>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-full min-h-0 overflow-hidden">
        <div className="hidden md:block h-full min-h-0 overflow-hidden">
          <AppSidebar />
        </div>

        <div className="min-w-0 h-full min-h-0 flex flex-col overflow-hidden">
          <AppTopbar onOpenSidebar={() => setOpen(true)} />

          {/* SOLO AQUÍ HAY SCROLL */}
          <main className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AppShell>
  );
}