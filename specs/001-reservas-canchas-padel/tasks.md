---

description: "Task list template for feature implementation"
---

# Tasks: Reservas de Canchas de Pádel

**Input**: Design documents from `/specs/001-reservas-canchas-padel/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: No solicitadas explícitamente en spec.md (ni TDD); esta lista NO incluye
tareas de tests dedicadas. Si se desea cobertura automatizada más adelante, usar el
stack ya decidido en research.md (Vitest + Supertest + React Testing Library).

**Organization**: Tareas agrupadas por historia de usuario (US1/US2/US3 de spec.md)
para permitir implementación y prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3)
- Rutas de archivo exactas incluidas en cada descripción

## Path Conventions

Estructura plana de `plan.md`: `backend/src/`, `frontend/src/`, `db/` en la raíz del
repositorio (Constitución Principio IV).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización de los proyectos backend y frontend

- [X] T001 Crear la estructura de carpetas de `plan.md`: `backend/src/{db,routes,middleware,lib}`, `backend/tests`, `frontend/src/{components,pages,api}`, `frontend/tests`, `db/`
- [X] T002 [P] Inicializar proyecto backend en `backend/` (`package.json`, `tsconfig.json`) con dependencias `express`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `cookie-parser` y sus `@types/*` (research.md §1, §2)
- [X] T003 [P] Inicializar proyecto frontend en `frontend/` con Vite + React 18 + TypeScript, y configurar Tailwind CSS (plan.md Technical Context)
- [X] T004 [P] Configurar ESLint + Prettier compartidos para `backend/` y `frontend/` (estilo funcional, camelCase/PascalCase — Constitución Principio V)
- [X] T005 [P] Configurar Vitest en `backend/vitest.config.ts` y `frontend/vitest.config.ts`, añadiendo `supertest` (backend) y `@testing-library/react` (frontend) como dependencias de desarrollo (research.md §3), sin escribir pruebas todavía

**Checkpoint**: Ambos proyectos instalan y arrancan (`npm run dev`) sin funcionalidad aún.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura núcleo que TODAS las historias de usuario necesitan

**⚠️ CRITICAL**: Ninguna historia de usuario puede comenzar hasta completar esta fase

- [X] T006 Crear `db/schema.sql` con las tablas `usuarios`, `canchas`, `reservas` según `data-model.md`, incluyendo verbatim: `email TEXT NOT NULL UNIQUE` (normalizado en minúsculas), `estado TEXT NOT NULL CHECK (estado IN ('activa','cancelada'))`, y los dos índices únicos parciales `UNIQUE (cancha_id, fecha, hora_inicio) WHERE estado = 'activa'` y `UNIQUE (usuario_id) WHERE estado = 'activa'` (Constitución Principios II y III)
- [X] T007 Crear `backend/src/db/connection.ts`: conexión síncrona `better-sqlite3` a `db/padel.db` (singleton), que aplica `db/schema.sql` si las tablas no existen
- [X] T008 Crear `backend/src/db/seedCanchas.ts`: sembrado idempotente de las 5 canchas fijas con `id` 1–5 y `nombre` exactamente "Cancha Laureles", "Cancha El Poblado", "Cancha Belén", "Cancha Robledo", "Cancha Envigado" (data-model.md Cancha, FR-005); sin ningún endpoint de creación/edición/borrado (Constitución Principio I)
- [X] T009 [P] Crear `backend/src/lib/token.ts`: firmar y verificar JWT (HS256) para la cookie de sesión `session` (research.md §1)
- [X] T010 [P] Crear `backend/src/lib/errors.ts`: helper que construye respuestas `{ "error": "mensaje amigable" }` con el código HTTP semántico correspondiente (`400/401/403/404/409`), sin exponer stack traces (Constitución Principio VI, contracts/api.md)
- [X] T011 Crear `backend/src/middleware/auth.ts`: middleware que lee la cookie `session`, verifica el JWT (usa T009), adjunta `usuarioId` al request, y responde `401 { "error": "..." }` (vía T010) si falta o es inválida/expirada (FR-003, Constitución Principio III). Incluye implementar `GET /api/auth/me` (añadido al contrato durante la implementación — ver contracts/api.md) como único endpoint que usa este middleware en esta fase, para que T014 pueda verificar la sesión tras un F5
- [X] T012 Crear `backend/src/server.ts`: bootstrap de Express con `cookie-parser`, parseo JSON, montaje de routers (a añadir en fases siguientes) y manejador global de errores que usa el formato uniforme de T010
- [X] T013 [P] Crear `frontend/src/api/client.ts`: wrapper `fetch` tipado con `credentials: 'include'` (envía la cookie httpOnly), que mapea toda respuesta no-2xx al campo `error` del contrato uniforme (contracts/api.md) para mostrarlo como mensaje amigable
- [X] T014 Crear `frontend/src/components/ProtectedRoute.tsx` + contexto/hook de sesión en `frontend/src/api/authContext.tsx`: si no hay sesión activa, redirige de inmediato al formulario de login/registro sin renderizar ninguna vista (FR-003; Clarifications 2026-09-15: "sin vista pública, ni siquiera el listado de canchas")
- [X] T015 Crear el esqueleto de rutas en `frontend/src/App.tsx`: `/login`, `/registro` (públicas) y `/disponibilidad`, `/mis-reservas` (envueltas en `ProtectedRoute` de T014)

**Checkpoint**: Fundación lista — las historias de usuario pueden comenzar.

---

## Phase 3: User Story 1 - Registro e Inicio de Sesión (Priority: P1) 🎯 MVP

**Goal**: Un visitante puede registrarse con correo/contraseña y luego iniciar sesión,
obteniendo acceso a las áreas protegidas de la aplicación.

**Independent Test**: Registrar una cuenta nueva, cerrar sesión, volver a iniciar
sesión con esas credenciales, y verificar que el acceso a disponibilidad/reservas solo
se habilita con sesión activa (spec.md US1).

### Implementation for User Story 1

- [X] T016 [P] [US1] Crear `backend/src/lib/password.ts`: `hashPassword`/`verifyPassword` con `bcryptjs` (costo 10) y `validarPassword(password)` que exige verbatim "mínimo 8 caracteres, al menos una letra y un número" (data-model.md Usuario.password_hash, FR-001); la contraseña en texto plano nunca se persiste ni se loguea
- [X] T017 [P] [US1] Crear `backend/src/db/usuarios.ts`: `crearUsuario(email, passwordHash)` y `buscarUsuarioPorEmail(email)` contra la tabla `usuarios` (`email TEXT NOT NULL UNIQUE`, normalizado a minúsculas antes de comparar/insertar — data-model.md)
- [X] T018 [US1] Implementar `POST /api/auth/registro` en `backend/src/routes/auth.ts` (usa T016, T017): valida formato de email y la regla de contraseña, normaliza email a minúsculas, responde `201 { id, email }` / `400` si la contraseña no cumple el mínimo / `409 { "error": "Este correo ya está registrado." }` si el email ya existe (contracts/api.md, FR-001 escenario 2)
- [X] T019 [US1] Implementar `POST /api/auth/login` en `backend/src/routes/auth.ts` (usa T017, T016, T009): verifica credenciales, firma JWT, responde `200 { id, email }` con `Set-Cookie: session=...; HttpOnly; SameSite=Lax`, o `401 { "error": "Correo o contraseña incorrectos." }` con el mismo mensaje genérico tanto si el correo no existe como si la contraseña es incorrecta (FR-002 escenarios 3-4, contracts/api.md)
- [X] T020 [US1] Implementar `POST /api/auth/logout` en `backend/src/routes/auth.ts` (usa middleware T011): limpia la cookie `session`, responde `200 {}`
- [X] T021 [US1] Montar el router de auth (`/api/auth/*`) en `backend/src/server.ts` (T012)
- [X] T022 [P] [US1] Crear `frontend/src/pages/Registro.tsx`: formulario email/contraseña que llama `POST /api/auth/registro` (vía T013), muestra el mensaje amigable de `400`/`409` bajo el campo correspondiente
- [X] T023 [P] [US1] Crear `frontend/src/pages/Login.tsx`: formulario email/contraseña que llama `POST /api/auth/login` (vía T013), muestra el mensaje genérico de `401`, y redirige a `/disponibilidad` en éxito
- [X] T024 [US1] Conectar el contexto de sesión (`frontend/src/api/authContext.tsx` de T014) para que se actualice tras login/logout exitoso, de modo que `ProtectedRoute` refleje el estado real de sesión (depende de T014, T023)

**Checkpoint**: User Story 1 funciona de forma independiente y es verificable end-to-end.

---

## Phase 4: User Story 2 - Ver Disponibilidad y Reservar una Cancha (Priority: P1)

**Goal**: Un usuario con sesión activa elige cancha y fecha, ve la grilla de 24
bloques horarios, y reserva uno de forma segura contra doble-reserva.

**Independent Test**: Con un usuario autenticado, seleccionar una de las 5 canchas y
una fecha futura, verificar que la grilla de 24 bloques muestra Disponible/Reservado
correctamente, confirmar una reserva sobre un bloque disponible y verificar que pasa a
"Reservado" (spec.md US2).

### Implementation for User Story 2

- [X] T025 [P] [US2] Crear `backend/src/db/canchas.ts`: `listarCanchas()` — `SELECT id, nombre FROM canchas` (catálogo sembrado en T008)
- [X] T026 [P] [US2] Crear `backend/src/db/reservas.ts`: `obtenerBloquesOcupados(canchaId, fecha)` y `crearReserva(usuarioId, canchaId, fecha, hora)`; `crearReserva` MUST ejecutarse dentro de una transacción síncrona `db.transaction(...)` de `better-sqlite3` que confía en los índices únicos parciales de T006 para que un `INSERT` colisionante falle con `SQLITE_CONSTRAINT`, distinguiendo dos causas: bloque ya ocupado (`cancha_id, fecha, hora_inicio`) vs. el usuario ya tiene otra reserva `activa` (`usuario_id`) (research.md §4, §5; FR-009, FR-011)
- [X] T027 [P] [US2] Crear `backend/src/lib/fechas.ts`: helpers puros `fechaEnVentana(fecha)` (verbatim: dentro de `[hoy, hoy+7 días]` inclusive), `horaValida(hora)` (entero `0`–`23`), y `bloqueYaTranscurrido(fecha, hora)` (si `fecha == hoy`, `hora` MUST ser mayor a la hora actual) — FR-006, FR-012, FR-013
- [X] T028 [US2] Implementar `GET /api/canchas` en `backend/src/routes/canchas.ts` (auth requerida vía T011; usa T025): `200 [{ id, nombre }]` / `401`
- [X] T029 [US2] Implementar `GET /api/disponibilidad` en `backend/src/routes/disponibilidad.ts` (usa T026, T027): valida `canchaId` (1–5) y `fecha` (T027), construye el array de 24 bloques `{ hora: 0..23, estado: "disponible"|"reservado" }`, responde `200`/`400`/`401` (contracts/api.md)
- [X] T030 [US2] Implementar `POST /api/reservas` en `backend/src/routes/reservas.ts` (usa T026, T027): valida `canchaId`/`fecha`/`hora` (`400` si fuera de ventana, ya transcurrido, o `hora` fuera de `0`–`23`), crea la reserva dentro de la transacción de T026, responde `201`/`401`/`409` con el mensaje distinto para cada causa de conflicto (contracts/api.md)
- [X] T031 [US2] Montar los routers de `canchas`, `disponibilidad` y `reservas` en `backend/src/server.ts` (depende de T028, T029, T030)
- [X] T032 [P] [US2] Crear `frontend/src/components/SelectorFecha.tsx`: fila de 7 fechas seleccionables (hoy…hoy+6), deshabilita cualquier fecha fuera de esa ventana (research.md §6, FR-006)
- [X] T033 [P] [US2] Crear `frontend/src/components/CanchaSelector.tsx`: lista las 5 canchas obtenidas de `GET /api/canchas` (vía T013)
- [X] T034 [US2] Crear `frontend/src/components/GrillaHoraria.tsx`: renderiza los 24 bloques de `GET /api/disponibilidad`, marca "Disponible"/"Reservado", deshabilita bloques ya transcurridos, permite seleccionar+confirmar un bloque disponible llamando `POST /api/reservas`, y muestra el mensaje amigable de `409` (depende de T032, T033)
- [X] T035 [US2] Crear `frontend/src/pages/Disponibilidad.tsx`: compone `CanchaSelector` + `SelectorFecha` + `GrillaHoraria` (depende de T034)
- [X] T036 [US2] Registrar la ruta protegida `/disponibilidad` en `frontend/src/App.tsx` apuntando a T035 (depende de T015)

**Checkpoint**: User Story 1 y 2 funcionan juntas; la prevención de doble-reserva es
verificable end-to-end (quickstart.md Escenario 2, paso 4).

---

## Phase 5: User Story 3 - Gestionar Mis Reservas (Priority: P2)

**Goal**: Un usuario con sesión activa ve sus reservas futuras y su historial pasado,
y puede cancelar una reserva futura propia.

**Independent Test**: Con un usuario que tiene al menos una reserva futura y una
pasada, abrir "Mis Reservas", verificar listas separadas con cancha/fecha/hora, y
cancelar una futura confirmando que desaparece y el bloque vuelve a "Disponible"
(spec.md US3).

### Implementation for User Story 3

- [X] T037 [P] [US3] Extender `backend/src/db/reservas.ts` con `listarReservasDeUsuario(usuarioId)` (separa `futuras`/`pasadas` comparando `fecha`+`hora_inicio` contra el momento actual — campo derivado, no almacenado, data-model.md) y `cancelarReserva(usuarioId, reservaId)` mediante `UPDATE reservas SET estado='cancelada' WHERE id=? AND usuario_id=? AND estado='activa'`, distinguiendo "no existe" (404), "no es del usuario" (403) y "ya pasó" (409) (FR-004, FR-017, FR-018)
- [X] T038 [US3] Implementar `GET /api/reservas/mias` en `backend/src/routes/reservas.ts` (usa T037): `200 { futuras: [...], pasadas: [...] }` con cada ítem mostrando `cancha`, `fecha`, `hora`, `estado` (FR-014, FR-015) / `401`
- [X] T039 [US3] Implementar `DELETE /api/reservas/:id` en `backend/src/routes/reservas.ts` (usa T037): `200 { id, estado: "cancelada" }` / `401` / `403 { "error": "No puedes cancelar una reserva que no es tuya." }` / `404` / `409 { "error": "No puedes cancelar una reserva que ya pasó." }` (contracts/api.md)
- [X] T040 [P] [US3] Crear `frontend/src/pages/MisReservas.tsx`: obtiene `GET /api/reservas/mias` (vía T013) y renderiza listas separadas y claramente distinguibles "Futuras" e "Historial", cada ítem con cancha/fecha/hora (FR-014, FR-015)
- [X] T041 [US3] Añadir la acción de cancelar en `frontend/src/pages/MisReservas.tsx`: paso de confirmación explícita antes de llamar `DELETE /api/reservas/:id`, actualiza la lista tras éxito (FR-016, FR-018) (depende de T040, T039)
- [X] T042 [US3] Registrar la ruta protegida `/mis-reservas` en `frontend/src/App.tsx` (T015) y añadir el enlace de navegación desde `Disponibilidad.tsx` (T035)

**Checkpoint**: Las 3 historias de usuario funcionan de forma independiente y en
conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias de usuario

- [X] T043 [P] Crear `frontend/src/components/ErrorNotice.tsx`: componente/mapeo único que traduce cualquier `error` de la API (T013) a un mensaje amigable consistente en toda la UI, sin exponer nunca detalles técnicos (Constitución Principio VI)
- [X] T044 [P] Añadir scripts `dev`/`build`/`start` en `backend/package.json` y `frontend/package.json`, y un `README.md` en la raíz con los pasos de `quickstart.md`
- [X] T045 Ejecutar manualmente los 3 escenarios de `quickstart.md` (incluida la prueba de colisión de doble-reserva) end-to-end y corregir cualquier hallazgo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede iniciar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias de usuario
- **User Stories (Phase 3-5)**: todas dependen de completar Foundational
  - US1 (P1) y US2 (P1) pueden avanzar en paralelo si hay más de una persona; en solitario, seguir el orden P1 → P1 → P2
  - US2 no requiere que US1 esté "terminada" para escribirse, pero sí para probarse end-to-end (necesita una sesión activa)
  - US3 reutiliza `backend/src/db/reservas.ts` de US2 (T026/T037 en el mismo archivo) — implementar después de US2
- **Polish (Phase 6)**: depende de que las historias deseadas estén completas

### User Story Dependencies

- **US1 (P1)**: puede iniciar tras Foundational — sin dependencia funcional de otras historias
- **US2 (P1)**: puede iniciar tras Foundational; para probarse end-to-end necesita una sesión (US1) pero su código no depende de los archivos de US1
- **US3 (P2)**: reutiliza y extiende `backend/src/db/reservas.ts` creado en US2 (T026) — implementar después de US2 por dependencia de archivo compartido, aunque es funcionalmente independiente

### Within Each User Story

- Modelos/acceso a datos (`db/*.ts`) antes que rutas Express
- Rutas Express antes que páginas frontend que las consumen
- Componentes de UI reutilizables antes que las páginas que los componen

### Parallel Opportunities

- Todas las tareas `[P]` de Setup (T002-T005) en paralelo
- T009, T010 de Foundational en paralelo; T013 en paralelo con el resto de Foundational backend
- Dentro de US1: T016 y T017 en paralelo; T022 y T023 en paralelo
- Dentro de US2: T025, T026, T027 en paralelo; luego T032 y T033 en paralelo
- Dentro de US3: T037 es prerrequisito de T038/T039 (mismo archivo); T040 puede avanzar en paralelo a T037-T039 (páginas vs. backend)
- T043 y T044 de Polish en paralelo

---

## Parallel Example: User Story 2

```bash
# Backend — lanzar juntas (archivos distintos, sin dependencias entre sí):
Task: "Crear backend/src/db/canchas.ts (T025)"
Task: "Crear backend/src/db/reservas.ts (T026)"
Task: "Crear backend/src/lib/fechas.ts (T027)"

# Frontend — lanzar juntas una vez el backend de US2 esté disponible:
Task: "Crear frontend/src/components/SelectorFecha.tsx (T032)"
Task: "Crear frontend/src/components/CanchaSelector.tsx (T033)"
```

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloquea todas las historias)
3. Completar Phase 3: User Story 1
4. **STOP y VALIDAR**: probar registro/login de forma independiente (quickstart.md Escenario 1)
5. Demo si está listo (aunque sin US2 el usuario aún no puede reservar nada)

### Incremental Delivery

1. Setup + Foundational → fundación lista
2. + User Story 1 → probar independientemente → demo (login funcional)
3. + User Story 2 → probar independientemente (incluida la prueba de colisión) → demo (**MVP real**: reservar una cancha)
4. + User Story 3 → probar independientemente → demo (ciclo completo de gestión de reservas)
5. Cada historia agrega valor sin romper las anteriores

### Solo Developer Strategy

Dado que este es un proyecto de alcance acotado (Constitución: simplicidad
estructural), la ruta recomendada es secuencial: Setup → Foundational → US1 → US2 →
US3 → Polish, validando con `quickstart.md` al final de cada fase antes de continuar.

---

## Notes

- `[P]` = archivos distintos, sin dependencias pendientes entre sí
- La etiqueta `[Story]` mapea cada tarea a su historia de usuario para trazabilidad
- Cada historia de usuario es completable y verificable de forma independiente
- Hacer commit tras cada tarea o grupo lógico de tareas
- Detenerse en cada Checkpoint para validar la historia de forma independiente antes de continuar
- Evitar: tareas vagas, conflictos de archivo simultáneos, dependencias entre historias que rompan su independencia funcional

---

## Phase 7: Convergence

- [ ] T046 Manejar globalmente una respuesta `401` de cualquier llamada a la API hecha fuera del login (p. ej. en `frontend/src/api/client.ts` o desde `frontend/src/api/authContext.tsx`): al recibir un `401` en una petición autenticada, limpiar el usuario de sesión y redirigir a `/login`, en vez de mostrar solo el mensaje de error inline como hoy en `frontend/src/components/GrillaHoraria.tsx` y `frontend/src/pages/MisReservas.tsx` per Edge Cases (sesión expira durante el flujo de reserva) / FR-003 (partial)
