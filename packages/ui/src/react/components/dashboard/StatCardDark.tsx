import React from "react";
import { cn } from "../../utils/cn";
import { Surface } from "../ui/Surface";

export function StatCardDark({
  title,
  value,
  suffix,
  tone = "purple",
  className,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  tone?: "purple" | "cyan" | "slate";
  className?: string;
}) {
  const toneClass =
    tone === "purple"
      ? "from-fuchsia-500/40 to-violet-500/20"
      : tone === "cyan"
      ? "from-cyan-400/35 to-blue-500/15"
      : "from-white/10 to-white/5";

  return (
    <Surface className={cn("p-5 overflow-hidden relative", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br", toneClass)} />
      <div className="relative">
        <div className="text-xs text-white/70">{title}</div>
        <div className="mt-2 flex items-end gap-2">
          <div className="text-3xl font-bold tracking-tight text-white">
            {value}
          </div>
          {suffix ? <div className="text-sm text-white/70 pb-1">{suffix}</div> : null}
        </div>
      </div>
    </Surface>
  );
}