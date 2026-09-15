import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, ApiError } from "../api/client";
import { ErrorNotice } from "../components/ErrorNotice";

interface ReservaConCancha {
  id: number;
  cancha: string;
  fecha: string;
  hora: number;
  estado: "activa" | "cancelada";
}

interface ReservasDeUsuario {
  futuras: ReservaConCancha[];
  pasadas: ReservaConCancha[];
}

function formatoReserva(r: ReservaConCancha): string {
  return `${r.cancha} — ${r.fecha} ${String(r.hora).padStart(2, "0")}:00`;
}

// FR-014 a FR-018: panel de reservas futuras/pasadas propias, con cancelación de
// futuras tras confirmación explícita.
export function MisReservas() {
  const [reservas, setReservas] = useState<ReservasDeUsuario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reservaACancelar, setReservaACancelar] = useState<ReservaConCancha | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [mensajeCancelacion, setMensajeCancelacion] = useState<string | null>(null);

  function cargar() {
    apiFetch<ReservasDeUsuario>("/api/reservas/mias")
      .then(setReservas)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar tus reservas."));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function confirmarCancelacion() {
    if (!reservaACancelar) return;
    setCancelando(true);
    setMensajeCancelacion(null);
    try {
      await apiFetch(`/api/reservas/${reservaACancelar.id}`, { method: "DELETE" });
      setReservaACancelar(null);
      cargar();
    } catch (err) {
      setMensajeCancelacion(
        err instanceof ApiError ? err.message : "Ocurrió un error inesperado.",
      );
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mis reservas</h1>
        <Link to="/disponibilidad" className="text-sm text-blue-600">
          Volver a disponibilidad
        </Link>
      </div>

      {error && <ErrorNotice mensaje={error} />}

      {reservas && (
        <>
          <section className="mb-6">
            <h2 className="mb-2 font-medium">Futuras</h2>
            {reservas.futuras.length === 0 && (
              <p className="text-sm text-gray-500">No tienes reservas futuras.</p>
            )}
            <ul className="flex flex-col gap-2">
              {reservas.futuras.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
                >
                  <span>{formatoReserva(r)}</span>
                  <button
                    type="button"
                    onClick={() => setReservaACancelar(r)}
                    className="text-sm text-red-600"
                  >
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-medium">Historial</h2>
            {reservas.pasadas.length === 0 && (
              <p className="text-sm text-gray-500">Aún no tienes historial.</p>
            )}
            <ul className="flex flex-col gap-2">
              {reservas.pasadas.map((r) => (
                <li key={r.id} className="rounded border border-gray-200 px-3 py-2 text-gray-600">
                  {formatoReserva(r)}
                  {r.estado === "cancelada" && (
                    <span className="ml-2 text-xs text-gray-400">(cancelada)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {reservaACancelar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="w-80 rounded bg-white p-4 shadow">
            <p className="mb-4">
              ¿Cancelar la reserva de {formatoReserva(reservaACancelar)}?
            </p>
            {mensajeCancelacion && (
              <div className="mb-2">
                <ErrorNotice mensaje={mensajeCancelacion} />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReservaACancelar(null)}
                className="px-3 py-2 text-sm"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelando}
                onClick={confirmarCancelacion}
                className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
