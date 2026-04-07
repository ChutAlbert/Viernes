import React, { useEffect } from "react";
import { cn } from "../../utils/cn";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  open,
  onClose,
  children,
  size = "md",
  closeOnBackdrop = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={cn("w-full rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]", sizeMap[size], className)}
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title = "¿Confirmar acción?",
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="p-6">
        <h3 className="font-semibold mb-2" style={{ color: "var(--c-text)" }}>{title}</h3>
        {description && (
          <div className="text-sm mb-6" style={{ color: "var(--c-text-3)" }}>{description}</div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl py-2 text-sm font-medium transition-colors hover:bg-[var(--c-hover)]"
            style={{ border: "1px solid var(--c-border-med)", color: "var(--c-text-2)" }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl py-2 text-sm font-medium transition-colors"
            style={
              variant === "danger"
                ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }
                : { background: "var(--c-accent-bg)", color: "var(--c-accent-text)", border: "1px solid var(--c-border-med)" }
            }
          >
            {loading ? "Procesando…" : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
