// packages/ui/src/react/components/ui/Card.tsx
import React from "react";
import { cn } from "../../utils/cn";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white shadow-sm border border-slate-200", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right, className }: { title: string; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-5 py-4 border-b border-slate-100", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {right}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}