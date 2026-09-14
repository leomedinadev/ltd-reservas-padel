<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: none (first adoption; all principles newly defined)
- Added principles:
  - I. Catálogo Cerrado de Canchas (NON-NEGOTIABLE)
  - II. Prevención de Colisiones — Double-Booking (NON-NEGOTIABLE)
  - III. Autenticación Obligatoria
  - IV. Simplicidad Estructural (No Sobreingeniería)
  - V. Estilo Funcional
  - VI. Manejo de Errores Amigable y Códigos HTTP Semánticos
- Added sections: Stack Tecnológico y Convenciones de Dominio; Flujo SDD del Agente de IA; Governance
- Removed sections: none (template placeholders replaced)
- Deferred / TODO placeholders: none
- Follow-up (manual, out of scope for this command): review dependent templates
  (plan-template, spec-template, tasks-template, agent guidance files) the next
  time they are used, to confirm they align with the domain rules introduced here
  (closed court catalog, double-booking prevention, mandatory auth, flat structure).
-->

# Sistema de Reservas de Pádel Constitution

## Core Principles

### I. Catálogo Cerrado de Canchas (NON-NEGOTIABLE)
El sistema DEBE operar exclusivamente sobre 5 canchas fijas: Cancha Laureles,
Cancha El Poblado, Cancha Belén, Cancha Robledo y Cancha Envigado. Ninguna
funcionalidad puede crear, eliminar o parametrizar canchas dinámicamente; el
catálogo se codifica como una lista fija en el sistema.
Rationale: El dominio del negocio está limitado a un conjunto conocido de
instalaciones. Permitir un catálogo dinámico o administrable introduce
complejidad de gestión (CRUD de canchas, permisos de administración) que el
negocio no ha solicitado.

### II. Prevención de Colisiones — Double-Booking (NON-NEGOTIABLE)
Ninguna reserva puede escribirse en la base de datos sin validar primero,
dentro de la misma operación, que la cancha seleccionada está libre en el
horario solicitado. Esta es la regla crítica del sistema y no admite
excepciones, bypass, ni rutas alternativas que omitan la validación.
Rationale: Una doble reserva rompe la confianza del usuario y el propósito
central de la aplicación; es el riesgo de mayor severidad del dominio.

### III. Autenticación Obligatoria
Todo flujo de creación, modificación o cancelación de reservas DEBE exigir
una sesión de usuario activa. Los endpoints de reserva DEBEN rechazar
peticiones no autenticadas con `401`.
Rationale: Las reservas están ligadas a un usuario responsable; sin
autenticación no hay trazabilidad ni forma de prevenir abuso del sistema.

### IV. Simplicidad Estructural (No Sobreingeniería)
El proyecto DEBE mantener una estructura plana: `/frontend`, `/backend`,
`/db`. Se PROHÍBE introducir Clean Architecture, capas separadas de
dominio/aplicación/infraestructura, o patrones de diseño complejos
(Repository, CQRS, Service Locator, etc.), salvo que una limitación técnica
concreta lo exija y quede justificada explícitamente.
Rationale: El alcance del sistema es acotado (5 canchas, reservas,
autenticación); la sobreingeniería aumenta el costo de mantenimiento sin
beneficio proporcional.

### V. Estilo Funcional
El código DEBE priorizar programación funcional y componentes funcionales de
React (Hooks). Se EVITA el uso de clases salvo que sea obligatorio por una
API externa. Nomenclatura: `camelCase` para funciones y variables,
`PascalCase` para interfaces y tipos.
Rationale: Un estilo consistente entre frontend y backend reduce la fricción
cognitiva y facilita el review de código.

### VI. Manejo de Errores Amigable y Códigos HTTP Semánticos
La UI NUNCA debe exponer errores crudos o *stack traces* al usuario final;
todo error técnico DEBE traducirse a un mensaje amigable (ej: "La cancha ya
fue reservada en este horario"). El backend DEBE responder siempre con
códigos HTTP semánticos: `400` (petición inválida), `401` (no autenticado),
`409` (conflicto de reserva), y demás códigos estándar según corresponda.
Rationale: La experiencia de usuario y la capacidad de depuración dependen de
señales de error claras, predecibles y consistentes.

## Stack Tecnológico y Convenciones de Dominio

- **Frontend / UI:** React, con Tailwind CSS para estilos.
- **Backend:** Node.js con Express.
- **Base de datos:** SQLite local (archivo `padel.db`). PROHIBIDO usar ORMs
  pesados; el acceso a datos se hace con `better-sqlite3` o sentencias SQL
  puras, manteniendo la simplicidad.
- **Lenguaje:** TypeScript en todo el stack (frontend y backend).
- **Bloques de tiempo:** las reservas operan en formato de 24 horas.

## Flujo SDD del Agente de IA

- **Cero Código Sombra:** El agente DEBE construir estrictamente lo
  documentado en `spec.md`. Se PROHÍBE añadir características "por si
  acaso" que no estén especificadas (ej: pasarelas de pago, perfiles de
  usuario complejos, notificaciones, roles de administrador).
- **Fuente de la Verdad:** Si una instrucción del usuario contradice esta
  constitución, o si el agente detecta una falla lógica en la
  especificación, DEBE detenerse, advertir el problema al usuario, y
  solicitar la actualización de `spec.md` antes de tocar el código fuente.

## Governance

Esta constitución prevalece sobre cualquier otra práctica de desarrollo en
este proyecto. Toda especificación (`spec.md`), plan (`plan.md`) y conjunto
de tareas (`tasks.md`) DEBE verificar cumplimiento con estos principios antes
de avanzar a implementación; cualquier desviación debe justificarse
explícitamente (por ejemplo, en una sección de Complexity Tracking del plan).

Las enmiendas a esta constitución requieren: (1) documentar el cambio y su
motivación, (2) incrementar la versión siguiendo versionado semántico
(MAJOR: eliminación o redefinición incompatible de principios; MINOR: nuevo
principio o expansión material de guía existente; PATCH: aclaraciones o
correcciones de redacción sin cambio de significado), y (3) actualizar el
Sync Impact Report al inicio de este archivo.

**Version**: 1.0.0 | **Ratified**: 2026-09-14 | **Last Amended**: 2026-09-14
