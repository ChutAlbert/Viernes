import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");

  function onSubmit(e) {
    e.preventDefault();

    // MVP: login local simple (luego lo cambiamos a auth real en FastAPI)
    if (!pin.trim()) return;

    localStorage.setItem("viernes_token", "dev");
    navigate("/app", { replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="text-slate-500 mt-1">Accede a tu dashboard de Viernes.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            PIN (temporal)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="1234"
            type="password"
          />
        </div>

        <button
          className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-800"
          type="submit"
        >
          Entrar
        </button>
      </form>

      <p className="text-xs text-slate-400">
        Este login es local (MVP). Luego lo conectamos a FastAPI con JWT.
      </p>
    </div>
  );
}
