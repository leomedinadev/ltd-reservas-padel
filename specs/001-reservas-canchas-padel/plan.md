# Implementation Plan: Reservas de Canchas de Pádel

**Branch**: `001-reservas-canchas-padel` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-reservas-canchas-padel/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Aplicación web (React + Express + SQLite, TypeScript en todo el stack) que permite a
usuarios autenticados por correo/contraseña reservar, entre 5 canchas fijas, un bloque
horario de 1 hora dentro de una ventana de 7 días, con prevención estricta de doble
reserva mediante validación atómica a nivel de base de datos, y un panel para
gestionar (ver/cancelar) sus propias reservas futuras y pasadas. Sin vista pública:
toda ruta sin sesión activa redirige a login/registro (per Clarifications 2026-09-15).

## Technical Context

**Language/Version**: TypeScript 5.x en todo el stack, ejecutado sobre Node.js 20 LTS (backend) y compilado para navegadores modernos (frontend, vía Vite)

**Primary Dependencies**: Backend: Express 4, better-sqlite3, bcryptjs (hash de contraseñas), jsonwebtoken (sesión vía JWT en cookie httpOnly). Frontend: React 18 (componentes funcionales/Hooks), Tailwind CSS, Vite (bundler/dev server)

**Storage**: SQLite local, archivo único `db/padel.db`, acceso vía `better-sqlite3` con SQL puro (sin ORM), según Principio IV de la constitución

**Testing**: Vitest (unit/integration en backend y frontend), Supertest (contract/integration de endpoints Express), React Testing Library (componentes de UI)

**Target Platform**: Backend como servicio Node.js (Linux/macOS, un solo proceso); Frontend como SPA servida al navegador (Chrome/Firefox/Safari recientes)

**Project Type**: Web application (frontend + backend separados, estructura plana por mandato constitucional)

**Performance Goals**: Sin metas de throughput estrictas — uso interno de un solo club con bajo volumen concurrente esperado (decenas de usuarios); prioridad en correctitud (cero doble-reservas) sobre rendimiento

**Constraints**: Catálogo de 5 canchas fijo e inmutable (Principio I); toda escritura de reserva MUST validar disponibilidad de forma atómica en la misma operación de base de datos, sin rutas alternativas (Principio II); todo endpoint de reserva MUST exigir sesión activa y responder `401` si no la hay (Principio III); estructura de carpetas plana `/frontend`, `/backend`, `/db`, sin capas de dominio/aplicación/infraestructura ni patrones Repository/CQRS (Principio IV); errores técnicos MUST traducirse a mensajes amigables en la UI y el backend MUST usar códigos HTTP semánticos (`400`/`401`/`403`/`404`/`409`) (Principio VI)

**Scale/Scope**: 5 canchas, grilla de 24 bloques/día × 7 días de ventana de reserva, 3 entidades de datos (Usuario, Cancha, Reserva), 4 historias de usuario (2×P1, 1×P2, autenticación implícita en P1-1)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Gate | Evaluación |
|---|---|---|
| I. Catálogo Cerrado de Canchas | El diseño NO debe incluir CRUD de canchas ni tabla administrable por usuarios | ✅ PASS — Cancha se sembrará (seed) como 5 filas fijas en `db/`; no se expone ningún endpoint de creación/edición/borrado de canchas |
| II. Prevención de Colisiones | Toda escritura de reserva debe validar disponibilidad en la misma operación atómica | ✅ PASS — se usará una transacción de `better-sqlite3` (síncrona) más un índice único parcial `(cancha_id, fecha, hora_inicio) WHERE estado='activa'` que hace que la colisión sea imposible incluso ante una condición de carrera a nivel de aplicación |
| III. Autenticación Obligatoria | Endpoints de reserva deben exigir sesión y responder 401 si no la hay | ✅ PASS — middleware de autenticación (verifica JWT de cookie httpOnly) aplicado a todas las rutas de canchas/disponibilidad/reservas; ninguna vista pública (ver Clarifications) |
| IV. Simplicidad Estructural | Estructura plana `/frontend`, `/backend`, `/db`; sin Clean Architecture ni Repository/CQRS | ✅ PASS — ver Project Structure abajo; acceso a datos vía funciones SQL directas en `backend/src/db/`, sin capa de repositorio abstracta |
| V. Estilo Funcional | Componentes funcionales de React + Hooks; camelCase/PascalCase | ✅ PASS — sin clases; convención de nombres aplicada en data-model y contracts |
| VI. Manejo de Errores Amigable | UI nunca expone errores crudos; backend usa códigos HTTP semánticos | ✅ PASS — contratos de API (Phase 1) definen `400/401/403/404/409` explícitos; frontend mapea cada código a un mensaje amigable |

No se detectan violaciones. La sección **Complexity Tracking** permanece vacía.

**Re-chequeo post-Phase 1** (tras research.md, data-model.md, contracts/api.md):
confirmado — el diseño final mantiene los 6 gates en ✅ PASS. En particular, los
índices únicos parciales de `data-model.md` (Reserva) hacen que los Principios I, II y
III sean garantías de base de datos, no solo de código de aplicación; y la estructura
de carpetas de `contracts/api.md`/Project Structure no introduce ninguna capa
prohibida por el Principio IV.

## Project Structure

### Documentation (this feature)

```text
specs/001-reservas-canchas-padel/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── db/               # conexión SQLite + SQL puro (schema, seed, queries) — sin capa Repository
│   ├── routes/            # auth.ts, canchas.ts, reservas.ts (handlers Express)
│   ├── middleware/         # auth.ts (verificación de JWT / sesión, 401)
│   ├── lib/                # utilidades puras (validación de fecha/hora, hashing, tokens)
│   └── server.ts
└── tests/
    ├── contract/          # Supertest sobre los endpoints de contracts/
    └── unit/

frontend/
├── src/
│   ├── components/         # bloques de UI reutilizables (GrillaHoraria, CanchaCard, etc.)
│   ├── pages/               # Login, Registro, Disponibilidad, MisReservas
│   ├── api/                  # helpers fetch tipados hacia el backend
│   └── App.tsx
└── tests/
    └── unit/               # React Testing Library

db/
└── schema.sql              # DDL versionado (tablas + índices únicos de colisión)
```

**Structure Decision**: Aplicación web con frontend y backend separados en la raíz del
repositorio (`frontend/`, `backend/`, `db/`), tal como exige el Principio IV de la
constitución (Simplicidad Estructural). No se introducen capas de dominio/aplicación/
infraestructura ni patrones Repository/CQRS: el acceso a datos vive en
`backend/src/db/` como funciones SQL directas sobre `better-sqlite3`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
