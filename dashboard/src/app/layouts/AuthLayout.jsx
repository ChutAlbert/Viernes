import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2" style={{ background: "var(--c-bg)", color: "var(--c-text)" }}>
      {/* Left: Login */}
      <div className="flex items-center justify-center p-6" style={{ background: "var(--c-shell)" }}>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Right: Branding */}
      <div
        className="hidden md:flex items-center justify-center p-10"
        style={{ background: "var(--c-bg)" }}
      >
        <div className="max-w-md space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">V</div>
            <h2 className="text-3xl font-bold" style={{ color: "var(--c-text)" }}>Viernes</h2>
          </div>
          <p style={{ color: "var(--c-text-2)" }}>
            Tu asistente personal local: chat, documentos y herramientas.
          </p>
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--c-border-med)", background: "var(--c-card)" }}>
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
              Tip: sube tus notas y PDFs en "Documentos" para que Viernes responda con tu contexto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
