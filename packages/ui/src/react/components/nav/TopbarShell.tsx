// packages/ui/src/react/components/nav/TopbarShell.tsx
import React from "react";
import { cn } from "../../utils/cn";

export function TopbarShell({
  left,
  center,
  right,
  className,
}: {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <div className="min-w-[180px]">{left}</div>
        <div className="flex-1">{center}</div>
        <div className="min-w-[180px] flex justify-end">{right}</div>
      </div>
    </header>
  );
}