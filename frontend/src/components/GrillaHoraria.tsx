import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../api/client";
import { ErrorNotice } from "./ErrorNotice";

interface Bloque {
  hora: number;
  estado: "disponible" | "reservado";
}

interface Disponibilidad {
  canchaId: number;
  fecha: string;
  bloques: Bloque[];
}

interface Props {
  canchaId: number;
  fecha: string;
}

function bloqueYaTranscurrido(fecha: string, hora: number): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  if (fecha < hoy) return true;
  if (fecha > hoy) return false;
  return hora <= new Date().getHours();
}

// FR-007, FR-008, FR-010, FR-011, FR-013: grilla de 24 bloques, selección +
// confirmación de una reserva sobre un bloque disponible y no transcurrido.
export function GrillaHoraria({ canchaId, fecha }: Props) {
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [mensajeReserva, setMensajeReserva] = useState<string | null>(null);

  function cargarDisponibilidad() {
    setCargando(true);
    setError(null);
    apiFetch<Disponibilidad>(
      `/api/disponibilidad?canchaId=${canchaId}&fecha=${fecha}`,
    )
      .then((data) => setBloques(data.bloques))
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar la disponibilidad."))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarDisponibilidad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canchaId, fecha]);

  async function confirmarReserva() {
    if (horaSeleccionada === null) return;
    setConfirmando(true);
    setMensajeReserva(null);
    try {
      await apiFetch("/api/reservas", {
        method: "POST",
        body: JSON.stringify({ canchaId, fecha, hora: horaSeleccionada }),
      });
      setHoraSeleccionada(null);
      cargarDisponibilidad();
    } catch (err) {
      setMensajeReserva(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      cargarDisponibilidad();
    } finally {
      setConfirmando(false);
    }
  }

  if (cargando) return <p className="text-sm text-gray-500">Cargando disponibilidad…</p>;
  if (error) return <ErrorNotice mensaje={error} />;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {bloques.map(({ hora, estado }) => {
          const transcurrido = bloqueYaTranscurrido(fecha, hora);
          const deshabilitado = estado === "reservado" || transcurrido;
          const seleccionado = hora === horaSeleccionada;
          return (
            <button
              key={hora}
              type="button"
              disabled={deshabilitado}
              onClick={() => setHoraSeleccionada(hora)}
              className={`rounded border px-2 py-2 text-sm ${
                seleccionado
                  ? "border-blue-600 bg-blue-600 text-white"
                  : deshabilitado
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "border-green-600 bg-white text-green-700"
              }`}
            >
              {String(hora).padStart(2, "0")}:00
            </button>
          );
        })}
      </div>

      {horaSeleccionada !== null && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={confirmando}
            onClick={confirmarReserva}
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
          >
            Confirmar reserva {String(horaSeleccionada).padStart(2, "0")}:00
          </button>
        </div>
      )}
      {mensajeReserva && (
        <div className="mt-2">
          <ErrorNotice mensaje={mensajeReserva} />
        </div>
      )}
    </div>
  );
}
