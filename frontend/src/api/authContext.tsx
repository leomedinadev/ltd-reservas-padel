import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch, ApiError, setOnSessionExpired } from "./client";

interface Usuario {
  id: number;
  email: string;
}

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  establecerUsuario: (usuario: Usuario | null) => void;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// FR-003 / Clarifications 2026-09-15: al montar la app se verifica contra
// GET /api/auth/me si la cookie httpOnly de sesión sigue siendo válida (por
// ejemplo tras un F5); mientras no se sepa, no se renderiza ninguna vista protegida.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    apiFetch<Usuario>("/api/auth/me")
      .then((u) => {
        if (!cancelado) setUsuario(u);
      })
      .catch(() => {
        if (!cancelado) setUsuario(null);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => setUsuario(null));
    return () => setOnSessionExpired(null);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setUsuario(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, establecerUsuario: setUsuario, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
