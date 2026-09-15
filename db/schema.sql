-- Esquema de la base de datos de Reservas de Canchas de Pádel.
-- Ver specs/001-reservas-canchas-padel/data-model.md para el detalle de cada regla.

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canchas (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  cancha_id INTEGER NOT NULL REFERENCES canchas(id),
  fecha TEXT NOT NULL,
  hora_inicio INTEGER NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('activa', 'cancelada')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Constitución Principio II (Prevención de Colisiones — Double-Booking, NO NEGOCIABLE):
-- ningún bloque de una cancha puede tener más de una reserva activa a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_bloque_activo
  ON reservas (cancha_id, fecha, hora_inicio)
  WHERE estado = 'activa';

-- FR-009: un usuario no puede tener más de una reserva activa a la vez en todo el sistema.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_usuario_activo
  ON reservas (usuario_id)
  WHERE estado = 'activa';
