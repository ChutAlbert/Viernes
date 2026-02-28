import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

export function NavItem({
  to,
  label,
  icon,
  end,
  className,
  variant = "dark",
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  end?: boolean;
  className?: string;
  variant?: "dark" | "light";
}) {
  const base = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition";

  const styles =
    variant === "dark"
      ? {
          idle: "text-white/70 hover:bg-white/5 hover:text-white",
          active: "bg-white/10 text-white border border-white/10",
        }
      : {
          idle: "text-slate-600 hover:bg-slate-100",
          active: "bg-slate-900 text-white",
        };

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(base, isActive ? styles.active : styles.idle, className)
      }
    >
      {icon ? <span className="w-4 flex justify-center">{icon}</span> : null}
      <span>{label}</span>
    </NavLink>
  );
}