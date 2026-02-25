// packages/ui/src/react/components/nav/SidebarShell.tsx
import React from "react";
import { cn } from "../../utils/cn";

export function SidebarShell({
  brand,
  children,
  className,
}: {
  brand?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("w-64 border-r border-slate-200 bg-white min-h-screen sticky top-0", className)}>
      <div className="px-5 h-16 flex items-center">{brand}</div>
      <nav className="px-3 py-3 space-y-1">{children}</nav>
    </aside>
  );
}