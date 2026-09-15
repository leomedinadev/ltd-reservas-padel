const DIAS_VENTANA_RESERVA = 7; // FR-006 / Clarifications 2026-09-15: hoy .. hoy+7 días inclusive

// FR-007 / Clarifications 2026-09-15: horario de operación del club 07:00–22:00;
// último bloque reservable empieza a las 21:00 y termina justo a las 22:00.
export const HORA_APERTURA = 7;
export const HORA_ULTIMO_BLOQUE = 21;

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumarDias(fechaISO: string, dias: number): string {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

// FR-006: la fecha MUST estar dentro de [hoy, hoy+7 días] inclusive.
export function fechaEnVentana(fechaISO: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) return false;
  const hoy = hoyISO();
  const limite = sumarDias(hoy, DIAS_VENTANA_RESERVA);
  return fechaISO >= hoy && fechaISO <= limite;
}

// FR-007, FR-012: los bloques son siempre horas completas dentro del horario de
// operación del club, `hora` entero 7-21.
export function horaValida(hora: unknown): hora is number {
  return (
    typeof hora === "number" &&
    Number.isInteger(hora) &&
    hora >= HORA_APERTURA &&
    hora <= HORA_ULTIMO_BLOQUE
  );
}

// FR-013: si `fecha` es hoy, `hora` MUST ser mayor a la hora actual (no se permiten
// bloques ya transcurridos ni fechas/horarios pasados).
export function bloqueYaTranscurrido(fechaISO: string, hora: number): boolean {
  const hoy = hoyISO();
  if (fechaISO < hoy) return true;
  if (fechaISO > hoy) return false;
  return hora <= new Date().getHours();
}
