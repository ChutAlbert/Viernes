import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

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
import RedesSociales from "./pages/RedesSociales";
import Notes from "./pages/Notes";
import Passwords from "./pages/Passwords";
import Users from "./pages/Users";
import Gallery from "./pages/Gallery";
import Tasks from "./pages/Tasks";
import QRGenerator from "./pages/QRGenerator";
import Ubicaciones from "./pages/Ubicaciones";
import Spotify from "./pages/Spotify";
import Precios from "./pages/Precios";

import { fetchMeThunk } from "@/store/slices/authSlice";

function RequireAuth({ children }) {
  const token = localStorage.getItem("viernes_token");
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMeThunk());
    }
  }, [token, user, dispatch]);

  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem("viernes_token");
  const user = useSelector((s) => s.auth.user);

  if (!token) return <Navigate to="/login" replace />;
  // Wait until user is loaded before deciding
  if (user && user.role !== "admin" && user.role !== "super_admin") return <Navigate to="/app" replace />;
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
        <Route path="redes" element={<RedesSociales />} />
        <Route path="precios" element={<Precios />} />
        <Route path="notas" element={<Notes />} />
        <Route path="passwords" element={<Passwords />} />
        <Route path="usuarios" element={<RequireAdmin><Users /></RequireAdmin>} />
        <Route path="galeria"     element={<RequireAdmin><Gallery /></RequireAdmin>} />
        <Route path="ubicaciones" element={<RequireAdmin><Ubicaciones /></RequireAdmin>} />
        <Route path="tareas" element={<Tasks />} />
        <Route path="qr" element={<QRGenerator />} />
        <Route path="spotify" element={<Spotify />} />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
