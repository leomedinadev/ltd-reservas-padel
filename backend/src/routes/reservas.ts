import { Router } from "express";
import { requiereAutenticacion, type RequestAutenticado } from "../middleware/auth.js";
import {
  crearReserva,
  ConflictoReservaError,
  listarReservasDeUsuario,
  cancelarReserva,
  ReservaNoEncontradaError,
  ReservaAjenaError,
  ReservaNoCancelableError,
} from "../db/reservas.js";
import { bloqueYaTranscurrido, fechaEnVentana, horaValida } from "../lib/fechas.js";
import { enviarError } from "../lib/errors.js";

export const reservasRouter = Router();

function canchaIdValido(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 1 && valor <= 5;
}

// POST /api/reservas — FR-009 a FR-013, contracts/api.md
reservasRouter.post("/", requiereAutenticacion, (req, res) => {
  const { usuarioId } = req as RequestAutenticado;
  const { canchaId, fecha, hora } = req.body as {
    canchaId?: unknown;
    fecha?: unknown;
    hora?: unknown;
  };

  if (!canchaIdValido(canchaId)) {
    enviarError(res, 400, "Selecciona una cancha válida.");
    return;
  }
  if (typeof fecha !== "string" || !fechaEnVentana(fecha)) {
    enviarError(res, 400, "Selecciona una fecha dentro de los próximos 7 días.");
    return;
  }
  if (!horaValida(hora)) {
    enviarError(res, 400, "Selecciona un bloque horario válido (7 a 21).");
    return;
  }
  if (bloqueYaTranscurrido(fecha, hora)) {
    enviarError(res, 400, "No puedes reservar un horario que ya pasó.");
    return;
  }

  try {
    const reserva = crearReserva(usuarioId, canchaId, fecha, hora);
    res.status(201).json({
      id: reserva.id,
      canchaId: reserva.cancha_id,
      fecha: reserva.fecha,
      hora: reserva.hora_inicio,
      estado: reserva.estado,
    });
  } catch (err) {
    if (err instanceof ConflictoReservaError) {
      enviarError(res, 409, err.message);
      return;
    }
    throw err;
  }
});

// GET /api/reservas/mias — FR-014, FR-015, contracts/api.md
reservasRouter.get("/mias", requiereAutenticacion, (req, res) => {
  const { usuarioId } = req as RequestAutenticado;
  res.status(200).json(listarReservasDeUsuario(usuarioId));
});

// DELETE /api/reservas/:id — FR-016, FR-017, FR-018, contracts/api.md
reservasRouter.delete("/:id", requiereAutenticacion, (req, res) => {
  const { usuarioId } = req as RequestAutenticado;
  const reservaId = Number(req.params.id);

  if (!Number.isInteger(reservaId)) {
    enviarError(res, 404, "La reserva no existe.");
    return;
  }

  try {
    const reserva = cancelarReserva(usuarioId, reservaId);
    res.status(200).json({ id: reserva.id, estado: reserva.estado });
  } catch (err) {
    if (err instanceof ReservaNoEncontradaError) {
      enviarError(res, 404, err.message);
      return;
    }
    if (err instanceof ReservaAjenaError) {
      enviarError(res, 403, err.message);
      return;
    }
    if (err instanceof ReservaNoCancelableError) {
      enviarError(res, 409, err.message);
      return;
    }
    throw err;
  }
});
