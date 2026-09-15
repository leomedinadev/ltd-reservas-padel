# API Contract: Reservas de Canchas de Pádel

**Feature**: [spec.md](../spec.md) · **Data model**: [data-model.md](../data-model.md)

Backend Express, JSON sobre HTTP. Sesión: cookie `httpOnly` `session` (JWT, ver
research.md §1). Todo endpoint marcado **Auth: requerida** responde `401
{"error": "..."}` si la cookie falta, es inválida o expiró (Constitución Principio
III). Todo error de negocio se traduce a un mensaje amigable en `error` (Constitución
Principio VI); nunca se expone un stack trace.

Formato de error uniforme:

```json
{ "error": "mensaje amigable en español" }
```

---

## POST /api/auth/registro

Auth: no requerida.

**Request**:
```json
{ "email": "persona@example.com", "password": "abcd1234" }
```

**Responses**:
- `201 Created` → `{ "id": 1, "email": "persona@example.com" }`
- `400 Bad Request` → contraseña no cumple mínimo 8 caracteres + letra + número, o
  email con formato inválido (FR-001)
- `409 Conflict` → `{ "error": "Este correo ya está registrado." }` (FR-001, escenario 2)

---

## POST /api/auth/login

Auth: no requerida.

**Request**:
```json
{ "email": "persona@example.com", "password": "abcd1234" }
```

**Responses**:
- `200 OK` → `{ "id": 1, "email": "persona@example.com" }` + `Set-Cookie: session=...;
  HttpOnly; SameSite=Lax` (FR-002, escenario 3)
- `401 Unauthorized` → `{ "error": "Correo o contraseña incorrectos." }` — mismo
  mensaje tanto si el correo no existe como si la contraseña es incorrecta, para no
  revelar existencia de la cuenta (FR-002, escenario 4)

---

## POST /api/auth/logout

Auth: requerida.

**Responses**:
- `200 OK` → `{}` + cookie `session` limpiada

---

## GET /api/auth/me

Añadido durante la implementación: el frontend es una SPA que se recarga (F5) sin
perder la cookie httpOnly, pero sí pierde cualquier estado de React en memoria; este
endpoint es la única forma de que `ProtectedRoute` sepa, al montar, si la cookie sigue
siendo válida sin duplicar lógica de verificación de JWT en el cliente. No introduce
ninguna funcionalidad de negocio nueva — reutiliza exactamente la misma verificación
de sesión que ya usan todos los demás endpoints protegidos (FR-003).

Auth: requerida.

**Responses**:
- `200 OK` → `{ "id": 1, "email": "persona@example.com" }`
- `401 Unauthorized`

---

## GET /api/canchas

Lista las 5 canchas fijas (FR-005).

Auth: **requerida** (FR-003: sin sesión activa no hay vista alguna, ni siquiera el
listado de canchas — Clarifications 2026-09-15).

**Responses**:
- `200 OK`:
```json
[
  { "id": 1, "nombre": "Cancha Laureles" },
  { "id": 2, "nombre": "Cancha El Poblado" },
  { "id": 3, "nombre": "Cancha Belén" },
  { "id": 4, "nombre": "Cancha Robledo" },
  { "id": 5, "nombre": "Cancha Envigado" }
]
```
- `401 Unauthorized`

---

## GET /api/disponibilidad?canchaId={id}&fecha={YYYY-MM-DD}

Grilla de 24 bloques horarios de una cancha/fecha (FR-006, FR-007, FR-008).

Auth: requerida.

**Query params**:
- `canchaId`: entero 1–5, requerido
- `fecha`: `YYYY-MM-DD`, requerido, MUST estar dentro de `[hoy, hoy+7 días]` (FR-006
  actualizado, Clarifications 2026-09-15)

**Responses**:
- `200 OK`:
```json
{
  "canchaId": 1,
  "fecha": "2026-09-16",
  "bloques": [
    { "hora": 0, "estado": "disponible" },
    { "hora": 1, "estado": "disponible" },
    { "hora": 14, "estado": "reservado" }
  ]
}
```
  Array de 24 elementos (`hora` 0–23), cada uno `"disponible"` o `"reservado"`
  (FR-008). Un bloque ya transcurrido (fecha=hoy, hora ≤ hora actual) se marca
  igualmente según su estado real, pero el frontend lo deshabilita para selección
  (FR-013).
- `400 Bad Request` → `canchaId` inválido o `fecha` fuera de la ventana de 7 días
- `401 Unauthorized`

---

## POST /api/reservas

Crea una reserva sobre un bloque disponible (FR-010, FR-011, FR-012, FR-013).

Auth: requerida.

**Request**:
```json
{ "canchaId": 1, "fecha": "2026-09-16", "hora": 14 }
```

**Responses**:
- `201 Created` → `{ "id": 42, "canchaId": 1, "fecha": "2026-09-16", "hora": 14,
  "estado": "activa" }`
- `400 Bad Request` → `fecha`/`hora` fuera de ventana permitida, fecha/hora ya
  transcurrida (FR-013), o `hora` fuera de `0`–`23`
- `401 Unauthorized`
- `409 Conflict`, dos causas posibles (mensaje distingue el caso):
  - `{ "error": "Ese horario ya no está disponible." }` — el bloque fue tomado por
    otro usuario antes de esta confirmación (FR-011, doble-reserva)
  - `{ "error": "Ya tienes una reserva activa. Cancélala antes de crear una nueva." }`
    — el usuario ya tiene otra reserva `activa` en el sistema (FR-009)

---

## GET /api/reservas/mias

Panel "Mis Reservas": futuras + historial pasado (FR-014, FR-015).

Auth: requerida.

**Responses**:
- `200 OK`:
```json
{
  "futuras": [
    { "id": 42, "cancha": "Cancha Laureles", "fecha": "2026-09-16", "hora": 14, "estado": "activa" }
  ],
  "pasadas": [
    { "id": 40, "cancha": "Cancha Envigado", "fecha": "2026-09-10", "hora": 9, "estado": "activa" },
    { "id": 39, "cancha": "Cancha Belén", "fecha": "2026-09-08", "hora": 18, "estado": "cancelada" }
  ]
}
```
  Solo reservas del usuario autenticado (FR-004, FR-014 escenario 4). "Futura" vs
  "pasada" se determina comparando `fecha`+`hora` contra el momento actual (campo
  derivado, ver data-model.md).
- `401 Unauthorized`

---

## DELETE /api/reservas/{id}

Cancela una reserva futura propia (FR-016, FR-017, FR-018).

Auth: requerida.

**Responses**:
- `200 OK` → `{ "id": 42, "estado": "cancelada" }` — libera el bloque (FR-018)
- `401 Unauthorized`
- `403 Forbidden` → `{ "error": "No puedes cancelar una reserva que no es tuya." }`
  (FR-004, Edge Cases: acceso a reserva de otro usuario)
- `404 Not Found` → el `id` no existe
- `409 Conflict` → `{ "error": "No puedes cancelar una reserva que ya pasó." }`
  (FR-017)
