import React from "react";
import { cn } from "../../utils/cn";
import { Spinner } from "../ui/Spinner";
import type { DocFile } from "./DocRow";

const EXT_ICON: Record<string, string> = {
  ".pdf": "📕",
  ".txt": "📄",
  ".md": "📝",
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

export type PreviewData = {
  preview: string;
  total_chars?: number;
  truncated?: boolean;
};

export function PreviewPane({
  doc,
  preview,
  loading = false,
  emptyMessage = "Selecciona un documento para ver su contenido",
  className,
}: {
  doc: DocFile | null;
  preview: PreviewData | null;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  // ── empty ──────────────────────────────────────────────────────────────────
  if (!doc) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center gap-3 text-white/20", className)}>
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("h-full flex items-center justify-center gap-2 text-white/30", className)}>
        <Spinner size="md" />
        <span className="text-sm">Cargando preview…</span>
      </div>
    );
  }

  if (!preview) return null;

  const ext = doc.ext ?? `.${doc.name.split(".").pop()}`;
  const icon = EXT_ICON[ext] ?? "📎";

  // ── content ────────────────────────────────────────────────────────────────
  return (
    <div className={cn("h-full flex flex-col min-h-0", className)}>
      {/* header */}
      <div className="shrink-0 flex items-center gap-3 pb-3 border-b border-white/10 mb-4">
        <span className="text-xl">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/90 truncate">{doc.name}</p>
          <p className="text-xs text-white/40">
            {fmtBytes(doc.size)} · {fmtDate(doc.modified)}
            {preview.total_chars && (
              <span className="ml-2 text-white/30">
                {preview.total_chars.toLocaleString()} caracteres
              </span>
            )}
            {preview.truncated && (
              <span className="ml-2 text-amber-400/60">· mostrando primeros 3 000</span>
            )}
          </p>
        </div>
      </div>

      {/* text */}
      <div className="flex-1 min-h-0 overflow-auto">
        <pre className="text-xs text-white/65 leading-relaxed whitespace-pre-wrap font-mono">
          {preview.preview}
        </pre>
      </div>
    </div>
  );
}
