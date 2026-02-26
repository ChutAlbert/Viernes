import { NavItem } from "@viernes/ui/react";

export default function AppSidebar() {
  return (
    <aside className="p-5 border-r border-white/10">
      <div className="text-white font-bold text-lg mb-6">Viernes</div>

      <div className="space-y-1">
        <NavItem to="/app" label="Overview" end variant="dark" className="text-white/80" />
        <NavItem to="/app/chat" label="Chat" variant="dark" className="text-white/80" />
        <NavItem to="/app/docs" label="Documentos" variant="dark" className="text-white/80" />
        <NavItem to="/app/settings" label="Settings" variant="dark" className="text-white/80" />
      </div>
    </aside>
  );
}