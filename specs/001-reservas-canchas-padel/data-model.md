# Phase 1 Data Model: Reservas de Canchas de Pádel

**Feature**: [spec.md](./spec.md) · **Research**: [research.md](./research.md)

Motor: SQLite (`db/padel.db`), acceso vía `better-sqlite3` con SQL puro (sin ORM), DDL
versionado en `db/schema.sql`. Tres entidades, según la sección *Key Entities* del spec.

## Usuario

Representa a una persona registrada (spec: FR-001, FR-002).

| Campo | Tipo SQLite | Reglas |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | |
| `email` | `TEXT NOT NULL` | Único (case-insensitive: se almacena normalizado en minúsculas); formato de correo válido, validado en el backend antes de insertar |
| `password_hash` | `TEXT NOT NULL` | Hash bcrypt (ver research.md §2) de una contraseña que cumple FR-001: mínimo 8 caracteres, al menos una letra y un número. La contraseña en texto plano nunca se persiste ni se loguea |
| `created_at` | `TEXT NOT NULL DEFAULT (datetime('now'))` | ISO 8601 |

**Índices**: `UNIQUE (email)`.

**Relaciones**: un Usuario tiene cero o más Reservas (1:N).

## Cancha

Catálogo fijo e inmutable de 5 instalaciones (spec: FR-005; Constitución Principio I).

| Campo | Tipo SQLite | Reglas |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY` | Asignado explícitamente en el seed (1–5), no autoincremental, para mantener IDs estables |
| `nombre` | `TEXT NOT NULL` | Único; uno de: "Cancha Laureles", "Cancha El Poblado", "Cancha Belén", "Cancha Robledo", "Cancha Envigado" |

**Índices**: `UNIQUE (nombre)`.

**Sembrado (seed)**: las 5 filas se insertan una única vez en la inicialización de la
base de datos (`db/schema.sql` o script de seed idempotente). **No existe** ningún
endpoint HTTP de creación, edición o borrado de canchas (Principio I, no negociable).

**Relaciones**: una Cancha tiene cero o más Reservas (1:N).

## Reserva

Representa la ocupación de una cancha por un usuario en un bloque horario (spec:
FR-007 a FR-018).

| Campo | Tipo SQLite | Reglas |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | |
| `usuario_id` | `INTEGER NOT NULL REFERENCES usuarios(id)` | Dueño de la reserva |
| `cancha_id` | `INTEGER NOT NULL REFERENCES canchas(id)` | Cancha reservada |
| `fecha` | `TEXT NOT NULL` | Formato `YYYY-MM-DD`; en el momento de creación MUST estar dentro de la ventana `[hoy, hoy+7 días]` inclusive (Clarifications 2026-09-15) y no MUST ser una fecha/hora ya transcurrida (FR-013) |
| `hora_inicio` | `INTEGER NOT NULL` | Entero `0`–`23`; representa el bloque completo de 1 hora `[hora_inicio, hora_inicio+1)` (FR-012) |
| `estado` | `TEXT NOT NULL CHECK (estado IN ('activa','cancelada'))` | `activa` al crear; pasa a `cancelada` solo vía cancelación explícita del dueño sobre una reserva futura (FR-016, FR-017) |
| `created_at` | `TEXT NOT NULL DEFAULT (datetime('now'))` | ISO 8601 |

**Campo derivado (no almacenado)**: *futura* significa `estado = 'activa'` **y**
`fecha`+`hora_inicio` aún no transcurridos respecto al momento de la consulta;
cualquier otra combinación (cancelada, o con fecha/hora ya pasada) se clasifica como
*pasada* (historial). Esto no es una columna —se recalcula en cada consulta— para
evitar un job de background que la mantenga sincronizada (simplicidad, Principio IV),
y hace que al cancelar una reserva futura esta "deje de aparecer como reserva futura
activa" tal como exige FR-016 (escenario 2), pasando de inmediato al historial.

**Índices / restricciones de integridad crítica**:

- `UNIQUE (cancha_id, fecha, hora_inicio) WHERE estado = 'activa'` — hace
  imposible, a nivel de motor de datos, que dos reservas activas ocupen el mismo
  bloque de la misma cancha (Constitución Principio II; ver research.md §4). Cualquier
  intento de `INSERT` que colisione falla con `SQLITE_CONSTRAINT`, que el backend
  traduce a `409 Conflict` (FR-011).
- `UNIQUE (usuario_id) WHERE estado = 'activa'` — hace imposible que un usuario
  tenga más de una reserva activa simultánea en todo el sistema (FR-009; ver
  research.md §5).

**Relaciones**: cada Reserva pertenece a exactamente un Usuario y a exactamente una
Cancha (N:1 con ambas).

## Transiciones de estado de Reserva

```text
        crear (bloque libre + sin otra reserva activa del usuario)
   ∅ ──────────────────────────────────────────────────────────► activa
                                                                     │
                                                                     │ cancelar (solo dueño,
                                                                     │ solo si fecha/hora
                                                                     │ aún no transcurrió)
                                                                     ▼
                                                                 cancelada
```

No existen otras transiciones: una reserva `activa` cuya fecha/hora ya transcurrió
simplemente se re-clasifica como *pasada* en las consultas (campo derivado), pero su
`estado` en base de datos permanece `activa` (no se cancela automáticamente; solo dejó
de bloquear el bloque por ser una fecha pasada, ya irrelevante para futuras
reservas). Cancelar una reserva ya pasada MUST ser rechazado (FR-017).

## Validaciones aplicativas (fuera de las restricciones de DB)

Estas reglas se validan en el backend antes de tocar la base de datos, pero **no**
reemplazan las restricciones únicas anteriores (que son la garantía final contra
condiciones de carrera):

- `email`: formato válido; unicidad case-insensitive (normalizado a minúsculas antes
  de comparar/insertar).
- `password` (solo en registro, nunca se persiste en claro): longitud ≥ 8, al menos
  una letra y un número (FR-001).
- `fecha` de una nueva reserva: dentro de `[hoy, hoy+7 días]` inclusive; si
  `fecha == hoy`, `hora_inicio` MUST ser mayor a la hora actual (FR-013).
- `hora_inicio`: entero `0`–`23` (FR-012; los bloques son siempre de 1 hora completa,
  no se aceptan fracciones).
- Antes de cancelar: la reserva MUST pertenecer al usuario autenticado (FR-004) y su
  `fecha`+`hora_inicio` MUST ser futura (FR-017).
