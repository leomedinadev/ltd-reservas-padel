// Fecha local en formato YYYY-MM-DD. No se usa `toISOString()` porque devuelve la
// fecha en UTC, que por la noche en América ya es el día siguiente.
export function fechaLocalISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// FR-013: un bloque de hoy ya transcurrió si su hora es menor o igual a la actual.
export function bloqueYaTranscurrido(fecha: string, hora: number): boolean {
  const ahora = new Date();
  const hoy = fechaLocalISO(ahora);
  if (fecha < hoy) return true;
  if (fecha > hoy) return false;
  return hora <= ahora.getHours();
}
