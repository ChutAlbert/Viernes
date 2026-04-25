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
      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={setPassword}
        variant="dark"
        showPasswordToggle
        required
      />

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