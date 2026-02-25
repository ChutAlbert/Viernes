import { SidebarShell, NavItem } from "@viernes/ui/react";

export default function AppSidebar() {
  return (
    <SidebarShell brand={<div className="font-bold">Viernes</div>}>
      <NavItem to="/app" label="Overview" end />
      <NavItem to="/app/chat" label="Chat" />
      <NavItem to="/app/docs" label="Documentos" />
      <NavItem to="/app/settings" label="Settings" />
    </SidebarShell>
  );
}