import jwt from "jsonwebtoken";

// research.md §1: JWT firmado (HS256) en cookie httpOnly, verificación stateless.
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-cambiar-en-produccion";
const JWT_EXPIRES_IN = "7d";

export interface SesionPayload {
  usuarioId: number;
  email: string;
}

export function firmarSesion(payload: SesionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verificarSesion(token: string): SesionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "usuarioId" in decoded &&
      "email" in decoded
    ) {
      const payload = decoded as SesionPayload;
      return { usuarioId: payload.usuarioId, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}
