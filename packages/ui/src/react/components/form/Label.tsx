import React from "react";
import { cn } from "../../utils/cn";

export function Label({
  name,
  children,
  htmlFor,
  className,
}: {
  name?: string;
  children?: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-xs font-medium mb-1", className)}
      style={{ color: "var(--c-text-2)" }}
    >
      {name ?? children}
    </label>
  );
}
