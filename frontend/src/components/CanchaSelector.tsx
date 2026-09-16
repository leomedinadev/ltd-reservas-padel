import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../api/client";

interface Cancha {
  id: number;
  nombre: string;
}

interface Props {
  canchaSeleccionada: number | null;
  onSeleccionar: (canchaId: number) => void;
}

// FR-005: listado estático de las 5 canchas fijas del club.
export function CanchaSelector({ canchaSeleccionada, onSeleccionar }: Props) {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Cancha[]>("/api/canchas")
      .then((lista) => {
        setCanchas(lista);
        if (lista.length > 0 && canchaSeleccionada === null) {
          onSeleccionar(lista[0].id);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar las canchas."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {canchas.map((cancha) => {
        const activa = cancha.id === canchaSeleccionada;
        return (
          <button
            key={cancha.id}
            type="button"
            onClick={() => onSeleccionar(cancha.id)}
            className={`rounded border px-3 py-2 text-sm ${
              activa
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-800"
            }`}
          >
            {cancha.nombre}
          </button>
        );
      })}
    </div>
  );
}
