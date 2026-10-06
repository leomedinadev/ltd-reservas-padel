# Reservas de Canchas de Pádel

Aplicación web para reservar, entre 5 canchas fijas de un club, un bloque horario de
1 hora dentro de una ventana de 7 días, con prevención estricta de doble reserva.

Ver la especificación completa en
[`specs/001-reservas-canchas-padel/`](specs/001-reservas-canchas-padel/spec.md).

## Stack

- **Backend**: Node.js + Express + TypeScript, SQLite (`better-sqlite3`, sin ORM)
- **Frontend**: React 18 + TypeScript + Tailwind CSS, empaquetado con Vite
- **Base de datos**: archivo único `db/padel.db` (esquema en `db/schema.sql`)

## Requisitos

- Node.js 20+

## Arrancar en desarrollo

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5173, con proxy /api -> backend)
cd frontend
npm install
npm run dev
```

Al arrancar, el backend aplica automáticamente `db/schema.sql` y siembra las 5
canchas fijas si la base de datos aún no existe.

## Variables de entorno

Todas son opcionales en desarrollo; ver [`.env.example`](.env.example).

| Variable | Para qué sirve |
|---|---|
| `JWT_SECRET` | Secreto para firmar las sesiones. **Obligatoria en producción**: el backend no arranca sin ella. |
| `PORT` | Puerto del backend (por defecto `3001`). |
| `DB_PATH` | Ruta del archivo SQLite (por defecto `db/padel.db`). |
| `TZ` | Zona horaria del club, por ejemplo `America/Guayaquil`. Define qué es "hoy" y qué bloques ya pasaron. |

## Tests

```bash
cd backend && npm test    # reglas de fechas, autenticación y colisión de reservas (SQLite en memoria)
cd frontend && npm test   # grilla horaria y fechas
```

Los tests del backend no tocan `db/padel.db`.

## Validación manual end-to-end

Ver [`specs/001-reservas-canchas-padel/quickstart.md`](specs/001-reservas-canchas-padel/quickstart.md)
para los 3 escenarios de validación (registro/login, disponibilidad + reserva con
prueba de colisión, gestión de "Mis Reservas").

## Scripts

| Comando | Dónde | Qué hace |
|---|---|---|
| `npm run dev` | `backend/`, `frontend/` | Arranca en modo desarrollo |
| `npm run build` | `backend/`, `frontend/` | Compila para producción |
| `npm start` | `backend/` | Arranca el backend ya compilado (`dist/`) |
| `npm run preview` | `frontend/` | Sirve el build de producción del frontend |
| `npm test` | `backend/`, `frontend/` | Tests con Vitest |
| `npm run lint` | `backend/`, `frontend/` | ESLint |
| `npm run format` | raíz del repo | Prettier sobre `backend/src` y `frontend/src` |
