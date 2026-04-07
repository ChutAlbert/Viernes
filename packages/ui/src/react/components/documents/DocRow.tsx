import React from "react";
import { cn } from "../../utils/cn";
import { Spinner } from "../ui/Spinner";

export type DocFile = {
  name: string;
  size: number;
  modified: number;
  ext?: string;
};

const EXT_ICON: Record<string, string> = {
  ".pdf": "📕",
  ".txt": "📄",
  ".md":  "📝",
  ".docx": "📘",
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function DocRow({
  doc,
  isSelected = false,
  onSelect,
  onDelete,
  deleting = false,
  showDelete = true,
  className,
}: {
  doc: DocFile;
  isSelected?: boolean;
  onSelect?: (doc: DocFile) => void;
  onDelete?: (name: string) => void;
  deleting?: boolean;
  showDelete?: boolean;
  className?: string;
}) {
  const ext = doc.ext ?? `.${doc.name.split(".").pop()}`;
  const icon = EXT_ICON[ext] ?? "📎";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(doc)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(doc); } }}
      className={cn("w-full text-left group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer", className)}
      style={{
        border: isSelected ? "1px solid var(--c-border-med)" : "1px solid transparent",
        background: isSelected ? "var(--c-hover)" : "transparent",
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--c-hover)"; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <span className="text-lg shrink-0">{icon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{doc.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>
          {fmtBytes(doc.size)} · {fmtDate(doc.modified)}
        </p>
      </div>

      {showDelete && onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(doc.name); }}
          disabled={deleting}
          title="Eliminar"
          className={cn(
            "shrink-0 transition-opacity p-1 rounded-lg",
            "opacity-0 group-hover:opacity-100",
            "hover:text-red-400 hover:bg-red-500/10",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          style={{ color: "var(--c-text-3)" }}
        >
          {deleting ? (
            <Spinner size="xs" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
