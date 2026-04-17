import { Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Documents from "./pages/Documents";

import Gmail from "./pages/Gmail";
import Website from "./pages/Website";
import ServiceDetail from "./pages/ServiceDetail";
import Piezas from "./pages/Piezas";
import PiezaDetail from "./pages/PiezaDetail";
import Catalogo from "./pages/Catalogo";
import CatalogoProductoDetail from "./pages/CatalogoProductoDetail";
import Inventario from "./pages/Inventario";

// guard súper simple (por ahora)
function RequireAuth({ children }) {
  const token = localStorage.getItem("viernes_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        path="/app"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="gmail" element={<Gmail />} />
        <Route path="chat" element={<Chat />} />
        <Route path="docs" element={<Documents />} />
        <Route path="website" element={<Website />} />
        <Route path="website/services/:slug" element={<ServiceDetail />} />
        <Route path="piezas" element={<Piezas />} />
        <Route path="piezas/:id" element={<PiezaDetail />} />
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="catalogo/:id" element={<CatalogoProductoDetail />} />
        <Route path="inventario" element={<Inventario />} />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
