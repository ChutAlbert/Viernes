// packages/ui/src/react/components/nav/NavItem.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

export function NavItem({
  to,
  label,
  icon,
  end,
  className,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  end?: boolean;
  className?: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
          isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
          className
        )
      }
    >
      {icon ? <span className="w-5 flex justify-center">{icon}</span> : null}
      <span>{label}</span>
    </NavLink>
  );
}