import { db } from "./connection.js";
import { bloqueYaTranscurrido } from "../lib/fechas.js";

export interface Reserva {
  id: number;
  usuario_id: number;
  cancha_id: number;
  fecha: string;
  hora_inicio: number;
  estado: "activa" | "cancelada";
  created_at: string;
}

export type MotivoConflictoReserva = "bloque_ocupado" | "usuario_ya_tiene_activa";

// FR-009 y FR-011: dos causas de conflicto distintas, cada una con su propio mensaje.
export class ConflictoReservaError extends Error {
  readonly motivo: MotivoConflictoReserva;

  constructor(motivo: MotivoConflictoReserva, mensaje: string) {
    super(mensaje);
    this.motivo = motivo;
  }
}

export function obtenerBloquesOcupados(canchaId: number, fecha: string): Set<number> {
  const filas = db
    .prepare(
      "SELECT hora_inicio FROM reservas WHERE cancha_id = ? AND fecha = ? AND estado = 'activa'",
    )
    .all(canchaId, fecha) as { hora_inicio: number }[];
  return new Set(filas.map((f) => f.hora_inicio));
}

// research.md §4 y §5: la transacción re-verifica ambas reglas de negocio críticas
// (bloque libre y usuario sin otra reserva activa) dentro de la misma operación
// síncrona de better-sqlite3; los índices únicos parciales de db/schema.sql son el
// respaldo final que hace la colisión imposible incluso si esta verificación tuviera
// un error (Constitución Principio II, no negociable).
const crearReservaTx = db.transaction(
  (usuarioId: number, canchaId: number, fecha: string, hora: number): Reserva => {
    const bloqueOcupado = db
      .prepare(
        "SELECT 1 FROM reservas WHERE cancha_id = ? AND fecha = ? AND hora_inicio = ? AND estado = 'activa'",
      )
      .get(canchaId, fecha, hora);
    if (bloqueOcupado) {
      throw new ConflictoReservaError("bloque_ocupado", "Ese horario ya no está disponible.");
    }

    const usuarioYaActivo = db
      .prepare("SELECT 1 FROM reservas WHERE usuario_id = ? AND estado = 'activa'")
      .get(usuarioId);
    if (usuarioYaActivo) {
      throw new ConflictoReservaError(
        "usuario_ya_tiene_activa",
        "Ya tienes una reserva activa. Cancélala antes de crear una nueva.",
      );
    }

    const info = db
      .prepare(
        "INSERT INTO reservas (usuario_id, cancha_id, fecha, hora_inicio, estado) VALUES (?, ?, ?, ?, 'activa')",
      )
      .run(usuarioId, canchaId, fecha, hora);

    return db
      .prepare("SELECT * FROM reservas WHERE id = ?")
      .get(info.lastInsertRowid) as Reserva;
  },
);

export function crearReserva(
  usuarioId: number,
  canchaId: number,
  fecha: string,
  hora: number,
): Reserva {
  return crearReservaTx(usuarioId, canchaId, fecha, hora);
}

export interface ReservaConCancha {
  id: number;
  cancha: string;
  fecha: string;
  hora: number;
  estado: "activa" | "cancelada";
}

export interface ReservasDeUsuario {
  futuras: ReservaConCancha[];
  pasadas: ReservaConCancha[];
}

// FR-014, FR-015, FR-016 (escenario 2: al cancelar, la reserva "deja de aparecer
// como reserva futura activa"): "futura" MUST ser una reserva activa cuya fecha/hora
// aún no transcurrió; cualquier otra combinación (cancelada, o con fecha/hora ya
// pasada) va al historial. Es un campo derivado, no una columna (data-model.md).
export function listarReservasDeUsuario(usuarioId: number): ReservasDeUsuario {
  const filas = db
    .prepare(
      `SELECT r.id, c.nombre AS cancha, r.fecha, r.hora_inicio AS hora, r.estado
       FROM reservas r
       JOIN canchas c ON c.id = r.cancha_id
       WHERE r.usuario_id = ?
       ORDER BY r.fecha DESC, r.hora_inicio DESC`,
    )
    .all(usuarioId) as ReservaConCancha[];

  const futuras: ReservaConCancha[] = [];
  const pasadas: ReservaConCancha[] = [];
  for (const reserva of filas) {
    const esFuturaActiva =
      reserva.estado === "activa" && !bloqueYaTranscurrido(reserva.fecha, reserva.hora);
    (esFuturaActiva ? futuras : pasadas).push(reserva);
  }
  return { futuras, pasadas };
}

export class ReservaNoEncontradaError extends Error {}
export class ReservaAjenaError extends Error {}
export class ReservaNoCancelableError extends Error {}

// FR-004, FR-016, FR-017, FR-018.
export function cancelarReserva(usuarioId: number, reservaId: number): Reserva {
  const reserva = db.prepare("SELECT * FROM reservas WHERE id = ?").get(reservaId) as
    | Reserva
    | undefined;

  if (!reserva) {
    throw new ReservaNoEncontradaError("La reserva no existe.");
  }
  if (reserva.usuario_id !== usuarioId) {
    throw new ReservaAjenaError("No puedes cancelar una reserva que no es tuya.");
  }
  if (reserva.estado === "cancelada") {
    throw new ReservaNoCancelableError("Esta reserva ya fue cancelada.");
  }
  if (bloqueYaTranscurrido(reserva.fecha, reserva.hora_inicio)) {
    throw new ReservaNoCancelableError("No puedes cancelar una reserva que ya pasó.");
  }

  db.prepare("UPDATE reservas SET estado = 'cancelada' WHERE id = ? AND usuario_id = ?").run(
    reservaId,
    usuarioId,
  );
  return db.prepare("SELECT * FROM reservas WHERE id = ?").get(reservaId) as Reserva;
}
