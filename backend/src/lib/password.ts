import bcrypt from "bcryptjs";

const COSTO_HASH = 10;

// FR-001: la contraseña MUST tener un mínimo de 8 caracteres e incluir al menos una
// letra y un número.
const REGLA_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function passwordValida(password: string): boolean {
  return REGLA_PASSWORD.test(password);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COSTO_HASH);
}

export async function verificarPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
