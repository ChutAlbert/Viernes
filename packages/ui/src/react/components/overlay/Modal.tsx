import React, { useEffect } from "react";
import { cn } from "../../utils/cn";
import { Surface } from "../ui/Surface";
import { Button } from "../form/Button";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

// ─── Modal base ───────────────────────────────────────────────────────────────
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
  // cierra con Escape
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <Surface
        className={cn("w-full shadow-2xl", sizeMap[size], className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Surface>
    </div>
  );
}

// ─── ConfirmModal (el más común) ──────────────────────────────────────────────
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
  /** "danger" → rojo, "default" → slate */
  variant?: "danger" | "default";
  loading?: boolean;
}) {
  const confirmClass =
    variant === "danger"
      ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300"
      : "bg-white/10 hover:bg-white/15 border border-white/15 text-white/90";

  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="p-6">
        <h3 className="text-white font-semibold mb-2">{title}</h3>

        {description && (
          <div className="text-sm text-white/55 mb-6">{description}</div>
        )}

        <div className="flex gap-3">
          <Button
            text={cancelText}
            onClick={onCancel}
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 border border-white/15 text-white/70"
          />
          <Button
            text={confirmText}
            loadingText="Procesando…"
            loading={loading}
            onClick={onConfirm}
            className={confirmClass}
          />
        </div>
      </div>
    </Modal>
  );
}
