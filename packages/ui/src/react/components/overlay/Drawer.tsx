import React from "react";
import { cn } from "../../utils/cn";

export function Drawer({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-72 bg-[#0f1a2e] border-r border-white/10 p-5",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}