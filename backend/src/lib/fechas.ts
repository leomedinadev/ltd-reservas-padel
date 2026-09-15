const DIAS_VENTANA_RESERVA = 7; // FR-006 / Clarifications 2026-09-15: hoy .. hoy+7 días inclusive

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

// FR-012: los bloques son siempre horas completas, `hora` entero 0-23.
export function horaValida(hora: unknown): hora is number {
  return typeof hora === "number" && Number.isInteger(hora) && hora >= 0 && hora <= 23;
}

// FR-013: si `fecha` es hoy, `hora` MUST ser mayor a la hora actual (no se permiten
// bloques ya transcurridos ni fechas/horarios pasados).
export function bloqueYaTranscurrido(fechaISO: string, hora: number): boolean {
  const hoy = hoyISO();
  if (fechaISO < hoy) return true;
  if (fechaISO > hoy) return false;
  return hora <= new Date().getHours();
}
