import type { Request, Response, NextFunction } from "express";

// Constitución Principio VI: la UI nunca debe exponer errores crudos ni stack
// traces; todo error de negocio se modela como AppError con un código HTTP
// semántico (400/401/403/404/409) y un mensaje ya amigable para mostrar tal cual.
export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function enviarError(res: Response, statusCode: number, mensaje: string): void {
  res.status(statusCode).json({ error: mensaje });
}

export function manejadorGlobalDeErrores(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    enviarError(res, err.statusCode, err.message);
    return;
  }
  console.error(err);
  enviarError(res, 500, "Ocurrió un error inesperado. Intenta de nuevo.");
}
