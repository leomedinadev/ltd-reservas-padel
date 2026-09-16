import { db } from "./connection.js";

export interface Usuario {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

// data-model.md: `email TEXT NOT NULL UNIQUE`, normalizado a minúsculas antes de
// comparar/insertar para que la unicidad sea case-insensitive.
export function crearUsuario(email: string, passwordHash: string): Usuario {
  const emailNormalizado = email.trim().toLowerCase();
  const info = db
    .prepare("INSERT INTO usuarios (email, password_hash) VALUES (?, ?)")
    .run(emailNormalizado, passwordHash);
  return buscarUsuarioPorId(Number(info.lastInsertRowid));
}

export function buscarUsuarioPorEmail(email: string): Usuario | undefined {
  const emailNormalizado = email.trim().toLowerCase();
  return db
    .prepare("SELECT * FROM usuarios WHERE email = ?")
    .get(emailNormalizado) as Usuario | undefined;
}

export function buscarUsuarioPorId(id: number): Usuario {
  const usuario = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id) as
    | Usuario
    | undefined;
  if (!usuario) throw new Error(`Usuario ${id} no encontrado`);
  return usuario;
}
