const DIAS_VENTANA = 7; // FR-006 / Clarifications 2026-09-15: hoy .. hoy+6 (7 días)

function fechaISO(offsetDias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

const ETIQUETA_DIA = new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric" });

interface Props {
  fechaSeleccionada: string;
  onSeleccionar: (fecha: string) => void;
}

export function SelectorFecha({ fechaSeleccionada, onSeleccionar }: Props) {
  const fechas = Array.from({ length: DIAS_VENTANA }, (_, i) => fechaISO(i));

  return (
    <div className="flex gap-2 overflow-x-auto">
      {fechas.map((fecha) => {
        const activa = fecha === fechaSeleccionada;
        return (
          <button
            key={fecha}
            type="button"
            onClick={() => onSeleccionar(fecha)}
            className={`shrink-0 rounded border px-3 py-2 text-sm capitalize ${
              activa
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-800"
            }`}
          >
            {ETIQUETA_DIA.format(new Date(`${fecha}T00:00:00`))}
          </button>
        );
      })}
    </div>
  );
}

export function fechaDeHoy(): string {
  return fechaISO(0);
}
