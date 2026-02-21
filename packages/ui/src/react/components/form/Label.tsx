import React from "react";
import { cn } from "../../utils/cn";

type LabelSize = "xs" | "sm" | "md" | "lg";
type LabelColor = "slate" | "muted" | "white" | "danger" | "success";

const sizeMap: Record<LabelSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const colorMap: Record<LabelColor, string> = {
  slate: "text-slate-700",
  muted: "text-slate-500",
  white: "text-white",
  danger: "text-red-600",
  success: "text-emerald-600",
};

export function Label({
  name,
  size = "sm",
  color = "slate",
  className,
}: {
  name: string;
  size?: LabelSize;
  color?: LabelColor;
  className?: string;
}) {
  return (
    <label className={cn("block font-medium", sizeMap[size], colorMap[color], className)}>
      {name}
    </label>
  );
}
