import React from "react";
import { cn } from "../../utils/cn";

export function Surface({
  children,
  className,
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("rounded-2xl", className)}
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
