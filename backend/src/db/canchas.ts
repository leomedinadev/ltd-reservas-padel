import { db } from "./connection.js";

export interface Cancha {
  id: number;
  nombre: string;
}

export function listarCanchas(): Cancha[] {
  return db.prepare("SELECT id, nombre FROM canchas ORDER BY id").all() as Cancha[];
}
