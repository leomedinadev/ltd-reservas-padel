import { db } from "./connection.js";

// Constitución Principio I (Catálogo Cerrado de Canchas, NO NEGOCIABLE): estas 5
// canchas son fijas e inmutables. No existe ningún endpoint que las cree, edite o
// elimine; este sembrado es la única forma en que llegan a la base de datos.
const CANCHAS_FIJAS: ReadonlyArray<{ id: number; nombre: string }> = [
  { id: 1, nombre: "Cancha Laureles" },
  { id: 2, nombre: "Cancha El Poblado" },
  { id: 3, nombre: "Cancha Belén" },
  { id: 4, nombre: "Cancha Robledo" },
  { id: 5, nombre: "Cancha Envigado" },
];

export function seedCanchas(): void {
  const insertar = db.prepare(
    "INSERT OR IGNORE INTO canchas (id, nombre) VALUES (@id, @nombre)",
  );
  const insertarTodas = db.transaction((canchas: typeof CANCHAS_FIJAS) => {
    for (const cancha of canchas) {
      insertar.run(cancha);
    }
  });
  insertarTodas(CANCHAS_FIJAS);
}
