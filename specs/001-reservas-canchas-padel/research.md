# Phase 0 Research: Reservas de Canchas de Pádel

**Feature**: [spec.md](./spec.md) | **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

El stack base (React + Tailwind, Node.js + Express, SQLite/`better-sqlite3`, TypeScript
en todo el stack, estructura plana) ya está fijado por la constitución del proyecto y
no requiere investigación. Este documento resuelve las decisiones técnicas que la
constitución deja abiertas.

## 1. Mecanismo de sesión/autenticación

**Decision**: JWT firmado (HS256) guardado en una cookie `httpOnly`, `sameSite=lax`,
`secure` en producción. El middleware de backend verifica el JWT en cada request a
rutas protegidas y responde `401` si falta o es inválido/expirado.

**Rationale**: El Assumption del spec deja abierto "sesión/cookie o token"; JWT en
cookie httpOnly evita mantener una tabla de sesiones server-side (menos estado, menos
complejidad — alineado con el Principio IV de simplicidad), evita exposición del token
a JavaScript del cliente (mitiga XSS) y es trivial de verificar de forma *stateless* en
cada endpoint con `jsonwebtoken`.

**Alternatives considered**:
- `express-session` con almacenamiento en SQLite: agrega una tabla de sesiones y un
  paquete adicional (`connect-sqlite3` o similar) sin beneficio claro para este alcance;
  rechazado por añadir estado y dependencias sin necesidad.
- JWT en `localStorage`: rechazado por exponer el token a XSS y complicar el manejo de
  expiración/logout respecto a una cookie httpOnly.

## 2. Hashing de contraseñas

**Decision**: `bcryptjs` (implementación pura en JavaScript de bcrypt), costo de hash
10.

**Rationale**: Cumple el requisito de "contraseña almacenada de forma segura" del
Assumption del spec y el requisito de longitud/complejidad mínima (FR-001) sin requerir
compilación nativa (a diferencia de `bcrypt`), lo que simplifica instalación y CI en
cualquier plataforma — coherente con el Principio IV (no sobreingeniería operativa).

**Alternatives considered**:
- `bcrypt` (nativo): más rápido, pero requiere toolchain de compilación nativa;
  innecesario para el volumen de usuarios esperado (Scale/Scope: bajo).
- `argon2`: algoritmo más moderno, pero añade complejidad de configuración de memoria
  sin beneficio proporcional al alcance del proyecto.

## 3. Framework de testing

**Decision**: Vitest para pruebas unitarias e de integración (backend y frontend),
Supertest para pruebas de contrato/integración sobre los endpoints Express, React
Testing Library para componentes de UI.

**Rationale**: Vitest comparte configuración con Vite (usado como bundler del
frontend) y funciona igual de bien en el backend TypeScript sobre Node, evitando
mantener dos runners de test distintos (Jest + otro). Supertest es el estándar de facto
para probar handlers Express sin levantar un servidor real. React Testing Library es
el estándar para probar componentes funcionales de React por comportamiento, no
implementación.

**Alternatives considered**:
- Jest: igualmente válido, pero requiere configuración adicional de transform para
  TypeScript/ESM que Vitest resuelve de forma nativa junto a Vite.

## 4. Prevención de doble-reserva (Principio II, no negociable)

**Decision**: Índice único parcial en SQLite sobre
`reservas(cancha_id, fecha, hora_inicio) WHERE estado = 'activa'`, combinado con una
transacción síncrona de `better-sqlite3` (`db.transaction(...)`) que (a) relee el
estado del bloque, (b) inserta la reserva. Si el índice único rechaza el `INSERT`
(`SQLITE_CONSTRAINT`), el backend responde `409 Conflict` con mensaje amigable.

**Rationale**: `better-sqlite3` es síncrono y opera sobre una única conexión de
proceso, lo que ya serializa las escrituras; el índice único parcial convierte la regla
de negocio en una garantía de la base de datos, no solo de la aplicación — cumpliendo
literalmente el Principio II ("no admite excepciones, bypass, ni rutas alternativas que
omitan la validación"). Esto es más robusto que una verificación `SELECT` seguida de
`INSERT` sin restricción, que sí sería vulnerable a condiciones de carrera bajo
concurrencia real.

**Alternatives considered**:
- Verificación aplicativa (`SELECT` + `INSERT` sin índice único): rechazada porque no
  garantiza atomicidad ante escritura concurrente real; violaría el Principio II.
- Bloqueo pesimista explícito (`BEGIN IMMEDIATE`): innecesario dado que el índice único
  parcial ya resuelve el caso al nivel de motor de base de datos con menor complejidad.

## 5. "Una reserva activa a la vez" por usuario (FR-009)

**Decision**: Índice único parcial adicional sobre `reservas(usuario_id) WHERE
estado = 'activa'`.

**Rationale**: Igual que en el punto 4, convierte una regla de negocio crítica en una
garantía de base de datos en vez de una comprobación aplicativa propensa a condiciones
de carrera, sin añadir complejidad estructural (una sola línea de DDL).

**Alternatives considered**: Verificación aplicativa antes del `INSERT` — rechazada por
la misma razón de atomicidad que en el punto 4.

## 6. Selector de fecha (ventana de 7 días)

**Decision**: Componente propio y ligero (una fila de 7 botones/tabs, "Hoy" +
próximos 6 días), sin librería de calendario externa.

**Rationale**: La ventana de reserva quedó fijada en 7 días (Clarifications
2026-09-15), por lo que un selector de fecha completo (mes/año) es funcionalidad no
solicitada; el Principio IV prohíbe complejidad no justificada, y una fila de 7 días es
trivial de construir e implica cero dependencias nuevas.

**Alternatives considered**: `react-datepicker` u otra librería de calendario —
rechazada por sobredimensionar la necesidad real (solo 7 fechas seleccionables) y por
añadir una dependencia externa sin justificación.

## 7. Manejo de fecha/hora

**Decision**: `Date`/`Intl` nativos de JavaScript más funciones puras propias en
`backend/src/lib/` y `frontend/src/api/` para representar `fecha` como cadena
`YYYY-MM-DD` y `hora_inicio` como entero `0–23`; sin librería de fechas externa
(`date-fns`/`dayjs`).

**Rationale**: El dominio solo requiere comparar fechas/horas en bloques discretos de 1
hora (sin zonas horarias múltiples, sin husos horarios variables declarados en el
spec); las utilidades nativas bastan y evitan una dependencia adicional, conforme al
Principio IV.

**Alternatives considered**: `date-fns` — rechazada por no ser necesaria dado el bajo
requisito de manipulación de fechas (comparación simple de cadenas ISO y enteros de
hora).

## Resumen de dependencias nuevas

| Paquete | Capa | Propósito |
|---|---|---|
| express | backend | Servidor HTTP / routing |
| better-sqlite3 | backend | Acceso a SQLite sin ORM |
| bcryptjs | backend | Hash de contraseñas |
| jsonwebtoken | backend | Emisión/verificación de sesión (JWT) |
| cookie-parser | backend | Lectura de la cookie httpOnly de sesión |
| react, react-dom | frontend | UI |
| tailwindcss | frontend | Estilos |
| vite | frontend/tooling | Dev server + bundler |
| vitest | backend+frontend | Test runner |
| supertest | backend | Pruebas de contrato de endpoints |
| @testing-library/react | frontend | Pruebas de componentes |

Todas las incógnitas de **Technical Context** quedan resueltas; no quedan marcadores
`NEEDS CLARIFICATION` pendientes.
