import { Outlet } from "react-router-dom";
import { AppShell, Drawer } from "@viernes/ui/react";
import { useState } from "react";
import AppSidebar from "@components/AppSidebar";
import AppTopbar from "@components/AppTopbar";

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <AppShell>
      {/* Mobile drawer */}
      <Drawer open={open} onClose={() => setOpen(false)}>
        <AppSidebar isMobile />
      </Drawer>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-[calc(100vh-3rem)]">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="min-w-0">
          <AppTopbar onOpenSidebar={() => setOpen(true)} />
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AppShell>
  );
}