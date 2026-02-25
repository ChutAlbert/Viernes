// packages/ui/src/react/components/dashboard/StatCard.tsx
import React from "react";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";

export function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
          {icon ?? <span className="text-slate-500">◎</span>}
        </div>

        <div>
          <div className="text-xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  );
}