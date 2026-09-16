import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "../api/client";
import { ErrorNotice } from "../components/ErrorNotice";

export function Registro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiFetch("/api/auth/registro", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm p-4">
      <h1 className="mb-4 text-xl font-semibold">Crear cuenta</h1>
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
          <span className="text-xs text-gray-500">
            Mínimo 8 caracteres, con al menos una letra y un número.
          </span>
        </label>
        {error && <ErrorNotice mensaje={error} />}
        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
        >
          Crear cuenta
        </button>
      </form>
      <p className="mt-4 text-sm">
        ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600">Inicia sesión</Link>
      </p>
    </div>
  );
}
