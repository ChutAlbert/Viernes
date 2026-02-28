import React from "react";
import { cn } from "../../utils/cn";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("h-screen overflow-hidden bg-[#0b1220] text-slate-100", className)}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-20 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative h-full p-3 sm:p-4 md:p-6">
        <div className="h-full min-h-0 rounded-[28px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}