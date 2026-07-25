import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button } from "@viernes/ui/react";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk } from "@/store/slices/authSlice";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token, loading, error } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const action = await dispatch(loginThunk({ email, password }));
    // Si quieres manejar el navigate aquí “solo si fue ok”
    if (loginThunk.fulfilled.match(action)) {
      navigate("/app", { replace: true });
    }
  }

  // Si ya hay token, evita mostrar login (opcional)
  useEffect(() => {
    if (token) navigate("/app", { replace: true });
  }, [token, navigate]);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>Iniciar sesión</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--c-text-3)" }}>Accede a tu dashboard de Viernes.</p>
      </div>

      <Input label="Email" type="email" value={email} onChange={setEmail} variant="dark" required />

      {/* Password con toggle propio (no depende del Input de @viernes/ui) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" style={{ color: "var(--c-text-2)" }}>Contraseña</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm outline-none"
            style={{ background: "var(--c-input-bg)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg"
            style={{ color: "var(--c-text-3)" }}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {error ? <div className="text-sm text-red-400">{error}</div> : null}

      <Button
        type="submit"
        text="Entrar"
        loading={loading}
        loadingText="Entrando..."
        className="w-full py-3 text-base"
      />
    </form>
  );
}