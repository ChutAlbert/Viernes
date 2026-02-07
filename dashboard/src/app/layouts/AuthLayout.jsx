import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Login */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Right: Filler / Branding */}
      <div className="hidden md:flex items-center justify-center p-10 bg-slate-950 text-white">
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-bold">Viernes</h2>
          <p className="text-slate-200">
            Tu asistente personal local: chat, documentos y herramientas.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-200">
              Tip: sube tus notas y PDFs en “Documentos” para que Viernes
              responda con tu contexto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
