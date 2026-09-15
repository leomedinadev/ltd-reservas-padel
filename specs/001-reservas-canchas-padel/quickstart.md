# Quickstart: Reservas de Canchas de Pádel

**Feature**: [spec.md](./spec.md) · **API**: [contracts/api.md](./contracts/api.md) ·
**Datos**: [data-model.md](./data-model.md)

Guía de validación manual end-to-end de las 3 historias de usuario del spec. No
sustituye a las pruebas automatizadas (`tests/contract`, `tests/unit`), pero confirma
que el feature funciona en el flujo real.

## Prerrequisitos

- Node.js 20 LTS instalado.
- Dependencias instaladas en `backend/` y `frontend/` (`npm install` en cada uno).
- Base de datos SQLite inicializada y sembrada (5 canchas fijas): script de setup en
  `backend/` que aplica `db/schema.sql` y siembra el catálogo de canchas si
  `db/padel.db` no existe o está vacío.

## Arrancar el entorno

```bash
# Terminal 1 — backend (API en, p. ej., http://localhost:3001)
cd backend && npm run dev

# Terminal 2 — frontend (SPA en, p. ej., http://localhost:5173)
cd frontend && npm run dev
```

## Escenario 1 — Registro e inicio de sesión (US1, P1)

1. Abrir el frontend sin sesión activa → MUST redirigir de inmediato al formulario de
   login/registro, sin mostrar ninguna vista pública (FR-003, Clarifications
   2026-09-15).
2. Registrarse con un correo nuevo y una contraseña de al menos 8 caracteres con letra
   y número (p. ej. `abcd1234`) → cuenta creada (FR-001).
3. Repetir el registro con el mismo correo → MUST rechazar con mensaje claro de correo
   ya registrado (FR-001, escenario 2).
4. Iniciar sesión con las credenciales creadas → MUST obtener sesión activa y acceso a
   disponibilidad/reservas (FR-002, escenario 3).
5. Intentar iniciar sesión con contraseña incorrecta → MUST rechazar con mensaje
   genérico, sin revelar si el correo existe (FR-002, escenario 4).

**Validación de contrato**: `POST /api/auth/registro` (201/400/409),
`POST /api/auth/login` (200/401) — ver contracts/api.md.

## Escenario 2 — Ver disponibilidad y reservar (US2, P1)

1. Con sesión activa, seleccionar una de las 5 canchas y una fecha dentro de la
   ventana de 7 días (hoy a hoy+6) → MUST mostrar una grilla de 24 bloques marcados
   "Disponible"/"Reservado" (FR-006, FR-007, FR-008).
2. Intentar seleccionar una fecha fuera de la ventana de 7 días en el calendario →
   MUST estar deshabilitada/no seleccionable.
3. Seleccionar un bloque "Disponible" y confirmar → MUST crear la reserva; el bloque
   pasa a "Reservado" (FR-010, FR-011).
4. **Prueba de colisión** (dos pestañas/sesiones de usuarios distintos): ambas abren la
   misma cancha/fecha, ambas seleccionan el mismo bloque disponible casi al mismo
   tiempo, ambas confirman → la primera confirmación en llegar al backend MUST
   ganar (201); la segunda MUST recibir `409` con mensaje claro y NO debe crearse una
   reserva duplicada (FR-011, Edge Cases).
5. Intentar reservar un bloque de una fecha/hora ya transcurrida → MUST rechazar
   (FR-013).
6. Con una reserva activa ya creada, intentar crear una segunda reserva activa (en
   cualquier cancha/fecha) → MUST rechazar con `409` y mensaje explicando que ya tiene
   una reserva activa (FR-009).

**Validación de contrato**: `GET /api/disponibilidad` (200/400/401),
`POST /api/reservas` (201/400/401/409) — ver contracts/api.md.

## Escenario 3 — Gestionar Mis Reservas (US3, P2)

1. Con al menos una reserva futura y una pasada (puede simularse creando una reserva y
   ajustando manualmente su `fecha` en la base de datos de prueba, o esperando a que
   una reserva de prueba quede en el pasado), abrir el panel "Mis Reservas" → MUST
   listar por separado futuras e historial pasado, cada ítem con cancha/fecha/hora
   (FR-014, FR-015).
2. Cancelar una reserva futura y confirmar → MUST desaparecer de "futuras"; el bloque
   correspondiente vuelve a "Disponible" en la grilla de disponibilidad (FR-016,
   FR-018).
3. Intentar cancelar una reserva pasada (del historial) → MUST rechazar (FR-017).
4. Con dos usuarios distintos, cada uno abre su propio panel → cada uno MUST ver
   únicamente sus propias reservas (FR-004, FR-014 escenario 4).

**Validación de contrato**: `GET /api/reservas/mias` (200/401),
`DELETE /api/reservas/{id}` (200/401/403/404/409) — ver contracts/api.md.

## Señales de éxito (Success Criteria del spec)

- SC-001: registro + login completos en menos de 2 minutos.
- SC-002: consulta de disponibilidad + confirmación de reserva en menos de 1 minuto.
- SC-003: 0 dobles reservas observadas tras repetir el Escenario 2, paso 4, varias
  veces.
- SC-005: cancelar una reserva futura toma como máximo 3 pasos (abrir panel,
  seleccionar, confirmar).
- SC-006: todo intento de acceso sin sesión activa (frontend o llamando directamente a
  la API) es bloqueado.
