// packages/ui/src/react/components/layout/Container.tsx
import React from "react";
import { cn } from "../../utils/cn";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}