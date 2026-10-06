const DIAS_VENTANA_RESERVA = 7; // FR-006 / Clarifications 2026-09-15: hoy .. hoy+7 días inclusive

// FR-007 / Clarifications 2026-09-15: horario de operación del club 07:00–22:00;
// último bloque reservable empieza a las 21:00 y termina justo a las 22:00.
export const HORA_APERTURA = 7;
export const HORA_ULTIMO_BLOQUE = 21;

// Todas las fechas se calculan en la hora local del servidor (la del club, ver TZ en
// el README). `toISOString()` devuelve la fecha en UTC, que en América ya es "mañana"
// a partir de las 19:00–20:00 y desfasaba la ventana de reserva.
function fechaLocalISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function hoyISO(): string {
  return fechaLocalISO(new Date());
}

function sumarDias(fechaISO: string, dias: number): string {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return fechaLocalISO(fecha);
}

// Descarta fechas con formato correcto pero inexistentes (p. ej. 2026-02-31).
function fechaExiste(fechaISO: string): boolean {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  return !Number.isNaN(fecha.getTime()) && fechaLocalISO(fecha) === fechaISO;
}

// FR-006: la fecha MUST estar dentro de [hoy, hoy+7 días] inclusive.
export function fechaEnVentana(fechaISO: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO) || !fechaExiste(fechaISO)) return false;
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
