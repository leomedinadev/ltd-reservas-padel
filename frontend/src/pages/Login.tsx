import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../api/authContext";
import { ErrorNotice } from "../components/ErrorNotice";

interface UsuarioResponse {
  id: number;
  email: string;
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const { establecerUsuario } = useAuth();

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const usuario = await apiFetch<UsuarioResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      establecerUsuario(usuario);
      navigate("/disponibilidad");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm p-4">
      <h1 className="mb-4 text-xl font-semibold">Iniciar sesión</h1>
      <form onSubmit={manejarSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span>Correo electrónico</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Contraseña</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        {error && <ErrorNotice mensaje={error} />}
        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
        >
          Entrar
        </button>
      </form>
      <p className="mt-4 text-sm">
        ¿No tienes cuenta? <Link to="/registro" className="text-blue-600">Regístrate</Link>
      </p>
    </div>
  );
}
