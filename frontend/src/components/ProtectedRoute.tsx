import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../api/authContext";

// FR-003 + Clarifications 2026-09-15: sin sesión activa no hay ninguna vista
// funcional; se redirige de inmediato al login sin renderizar el contenido protegido.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
