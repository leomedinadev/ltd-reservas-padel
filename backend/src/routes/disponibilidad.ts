import { Router } from "express";
import { requiereAutenticacion } from "../middleware/auth.js";
import { obtenerBloquesOcupados } from "../db/reservas.js";
import { fechaEnVentana } from "../lib/fechas.js";
import { enviarError } from "../lib/errors.js";

export const disponibilidadRouter = Router();

function canchaIdValido(valor: unknown): valor is number {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

// GET /api/disponibilidad — FR-006, FR-007, FR-008, contracts/api.md
disponibilidadRouter.get("/", requiereAutenticacion, (req, res) => {
  const canchaIdRaw = req.query.canchaId;
  const fecha = req.query.fecha;

  if (!canchaIdValido(canchaIdRaw)) {
    enviarError(res, 400, "Selecciona una cancha válida.");
    return;
  }
  if (typeof fecha !== "string" || !fechaEnVentana(fecha)) {
    enviarError(res, 400, "Selecciona una fecha dentro de los próximos 7 días.");
    return;
  }

  const canchaId = Number(canchaIdRaw);
  const ocupados = obtenerBloquesOcupados(canchaId, fecha);
  const bloques = Array.from({ length: 24 }, (_, hora) => ({
    hora,
    estado: ocupados.has(hora) ? ("reservado" as const) : ("disponible" as const),
  }));

  res.status(200).json({ canchaId, fecha, bloques });
});
