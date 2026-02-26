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
    <div className={cn("min-h-screen bg-[#0b1220] text-slate-100", className)}>
      {/* blobs decorativos (genéricos, no dicen nada de Viernes) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-20 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-none px-3 sm:px-4 md:px-6 py-4 md:py-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}