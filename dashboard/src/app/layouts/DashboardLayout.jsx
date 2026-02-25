import { Outlet } from "react-router-dom";
import { Container } from "@viernes/ui/react";
import AppSidebar from "@components/AppSidebar";
import AppTopbar from "@components/AppTopbar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <AppSidebar />

        <div className="flex-1 min-w-0">
          <AppTopbar />

          <main className="py-6">
            <Container>
              <Outlet />
            </Container>
          </main>
        </div>
      </div>
    </div>
  );
}