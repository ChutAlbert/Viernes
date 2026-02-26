import React from "react";
import { cn } from "../../utils/cn";

export function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0f1a2e]/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}