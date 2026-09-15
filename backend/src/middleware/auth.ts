import type { Request, Response, NextFunction } from "express";
import { verificarSesion } from "../lib/token.js";
import { enviarError } from "../lib/errors.js";

export interface RequestAutenticado extends Request {
  usuarioId: number;
  usuarioEmail: string;
}

// Constitución Principio III (Autenticación Obligatoria): todo endpoint de reserva
// MUST rechazar peticiones no autenticadas con 401. FR-003: sin sesión activa no hay
// ninguna vista funcional (ni el listado de canchas).
export function requiereAutenticacion(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.session as string | undefined;
  const sesion = token ? verificarSesion(token) : null;

  if (!sesion) {
    enviarError(res, 401, "Debes iniciar sesión para continuar.");
    return;
  }

  (req as RequestAutenticado).usuarioId = sesion.usuarioId;
  (req as RequestAutenticado).usuarioEmail = sesion.email;
  next();
}
