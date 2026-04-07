import React, { useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";

type FileInputSize = "sm" | "md" | "lg";
type FileInputVariant = "light" | "dark";

const sizeMap: Record<FileInputSize, { zone: string; text: string; icon: string }> = {
  sm: { zone: "py-3 px-4", text: "text-xs", icon: "w-4 h-4" },
  md: { zone: "py-5 px-4", text: "text-sm", icon: "w-5 h-5" },
  lg: { zone: "py-8 px-6", text: "text-sm", icon: "w-6 h-6" },
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function FileInput({
  label,
  accept,
  multiple = false,
  size = "md",
  maxBytes,
  disabled = false,
  variant = "light",
  onChange,
  className,
  id,
  name,
}: {
  label?: string;
  accept?: string;
  multiple?: boolean;
  size?: FileInputSize;
  maxBytes?: number;
  disabled?: boolean;
  variant?: FileInputVariant;
  onChange: (files: File[]) => void;
  className?: string;
  id?: string;
  name?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const s = sizeMap[size];
  const isDark = variant === "dark";

  function processFiles(incoming: FileList | null) {
    if (!incoming) return;
    const list = Array.from(incoming);

    if (maxBytes) {
      const over = list.filter((f) => f.size > maxBytes);
      if (over.length > 0) {
        setError(`${over.map((f) => f.name).join(", ")} excede el límite de ${fmtBytes(maxBytes)}`);
        return;
      }
    }

    setError(null);
    const next = multiple ? list : [list[0]];
    setFiles(next);
    onChange(next);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    e.target.value = "";
  }

  function removeFile(idx: number) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onChange(next);
  }

  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label name={label} color={isDark ? "white" : "slate"} size="xs" />}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Subir archivo"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed transition-colors",
          "flex flex-col items-center justify-center gap-2 text-center",
          s.zone,
          isDark
            ? dragging
              ? "border-[var(--c-border-med)] bg-[var(--c-hover)]"
              : "border-[var(--c-border)] bg-[var(--c-input-bg)] hover:border-[var(--c-border-med)]"
            : dragging
              ? "border-slate-400 bg-slate-50"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          id={id}
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={handleChange}
        />

        <svg
          className={cn(isDark ? "text-[var(--c-text-4)]" : "text-slate-400", s.icon)}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>

        <div>
          <p className={cn("font-medium", s.text, isDark ? "text-[var(--c-text-2)]" : "text-slate-700")}>
            {dragging
              ? "Suelta aquí"
              : files.length > 0
                ? multiple
                  ? `${files.length} archivo${files.length !== 1 ? "s" : ""} seleccionado${files.length !== 1 ? "s" : ""}`
                  : files[0].name
                : multiple
                  ? "Arrastra archivos o haz clic para seleccionar"
                  : "Arrastra un archivo o haz clic para seleccionar"}
          </p>
          {accept && files.length === 0 && (
            <p className={cn("mt-0.5", s.text, isDark ? "text-[var(--c-text-3)]" : "text-slate-400")}>
              {accept.replace(/\./g, "").toUpperCase().replace(/,/g, " · ")}
              {maxBytes ? ` · máx ${fmtBytes(maxBytes)}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* chips multiple */}
      {multiple && files.length > 0 && (
        <ul className="space-y-1 mt-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                isDark ? "border-[var(--c-border)] bg-[var(--c-input-bg)] text-[var(--c-text-2)]" : "border-slate-200 bg-slate-50 text-slate-700"
              )}>
              <span className="flex-1 truncate">{f.name}</span>
              <span className={cn("text-xs shrink-0", isDark ? "text-[var(--c-text-3)]" : "text-slate-400")}>{fmtBytes(f.size)}</span>
              <button type="button" onClick={() => removeFile(i)}
                className={cn("transition shrink-0", isDark ? "text-[var(--c-text-4)] hover:text-red-400" : "text-slate-400 hover:text-red-500")}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
