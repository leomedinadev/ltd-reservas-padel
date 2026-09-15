# Feature Specification: Reservas de Canchas de Pádel

**Feature Branch**: `001-reservas-canchas-padel`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Features principales: (1) Autenticación de Usuarios — registro/login por correo y contraseña; solo usuarios con sesión activa ven disponibilidad completa y reservan; cada usuario solo gestiona sus propias reservas. (2) Exploración y Selección de Canchas — listado estático de 5 canchas (Laureles, El Poblado, Belén, Robledo, Envigado); selección de fecha en calendario; grilla de 24 horas en bloques de 1 hora por cancha/fecha mostrando Disponible/Reservado; un usuario solo puede tener una reserva activa a la vez. (3) Creación de Reservas — selección de bloque disponible y confirmación; re-validación de disponibilidad antes de confirmar (prevención de colisión) con mensaje de error claro si el turno ya fue tomado; reservas solo en bloques completos de 1 hora; no se permiten reservas en fechas/horarios pasados. (4) Gestión Mis Reservas — panel con reservas futuras e historial pasado, mostrando cancha/fecha/hora; cancelación de reservas futuras con confirmación. Non-goals: sin pasarela de pagos, sin panel de administrador de canchas, sin notificaciones externas, sin reservas de más de 1 hora en un clic, sin matchmaking."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro e Inicio de Sesión (Priority: P1)

Como usuario nuevo, quiero registrarme con mi correo electrónico y contraseña, y luego iniciar sesión, para poder acceder a las funciones de reserva del club.

**Why this priority**: Es el prerequisito de acceso para todo lo demás: sin una sesión activa, ningún usuario puede ver la disponibilidad completa ni crear reservas. Sin esta historia no existe producto utilizable.

**Independent Test**: Puede probarse de forma aislada registrando una cuenta nueva con correo/contraseña, cerrando sesión, y volviendo a iniciar sesión con esas mismas credenciales, verificando que el acceso a las áreas protegidas (disponibilidad, reservas) solo se habilita con sesión activa.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** se registra con un correo electrónico válido y una contraseña, **Then** se crea su cuenta y puede iniciar sesión con esas credenciales.
2. **Given** un visitante intenta registrarse con un correo que ya está en uso, **When** envía el formulario de registro, **Then** el sistema rechaza el registro con un mensaje claro indicando que el correo ya está registrado.
3. **Given** un usuario registrado, **When** inicia sesión con correo y contraseña correctos, **Then** obtiene una sesión activa y accede a la disponibilidad completa y a la creación de reservas.
4. **Given** un usuario registrado, **When** inicia sesión con una contraseña incorrecta, **Then** el sistema rechaza el acceso con un mensaje claro, sin revelar si el correo existe o no.
5. **Given** un visitante sin sesión activa, **When** intenta acceder a la grilla de disponibilidad completa o a crear una reserva, **Then** el sistema le exige iniciar sesión antes de continuar.

---

### User Story 2 - Ver Disponibilidad y Reservar una Cancha (Priority: P1)

Como usuario con sesión activa, quiero elegir una cancha y una fecha, ver qué bloques horarios están disponibles, y reservar uno, para asegurar mi turno de juego.

**Why this priority**: Es el valor central de la aplicación: la razón de ser del sistema es permitir reservar una cancha de forma confiable, sin choques de horario. Sin esta historia no hay producto, solo un sistema de cuentas.

**Independent Test**: Con un usuario ya autenticado, puede probarse seleccionando una de las 5 canchas y una fecha futura, verificando que la grilla de 24 bloques horarios muestra correctamente qué horas están "Disponible" y cuáles "Reservado", y luego confirmando una reserva sobre un bloque disponible, verificando que dicho bloque pasa a mostrarse como "Reservado".

**Acceptance Scenarios**:

1. **Given** un usuario con sesión activa, **When** selecciona una cancha y una fecha, **Then** el sistema muestra una grilla de 24 bloques horarios de 1 hora para esa cancha y fecha, cada uno marcado como "Disponible" o "Reservado".
2. **Given** la grilla de disponibilidad visible, **When** el usuario selecciona un bloque marcado como "Disponible" y confirma, **Then** el sistema re-valida que el bloque sigue libre y, si es así, crea la reserva y el bloque pasa a mostrarse como "Reservado".
3. **Given** dos usuarios intentando reservar el mismo bloque casi al mismo tiempo, **When** el segundo usuario confirma después de que el primero ya reservó ese bloque, **Then** el sistema rechaza la segunda confirmación con un mensaje de error claro indicando que el horario ya no está disponible, y no crea una reserva duplicada.
4. **Given** un usuario con sesión activa, **When** intenta seleccionar un bloque horario correspondiente a una fecha u hora ya transcurrida, **Then** el sistema no permite seleccionarlo ni confirmarlo como reserva.
5. **Given** un usuario con sesión activa, **When** intenta confirmar una reserva que no corresponde a un bloque completo de 1 hora, **Then** el sistema no lo permite (solo se aceptan bloques horarios completos, ej. 14:00 a 15:00).

---

### User Story 3 - Gestionar Mis Reservas (Priority: P2)

Como usuario con sesión activa, quiero ver un panel con mis reservas futuras y mi historial de reservas pasadas, y poder cancelar una reserva futura, para mantener el control de mis turnos.

**Why this priority**: Complementa el flujo principal de reserva dándole al usuario visibilidad y control sobre sus propios turnos; no es indispensable para crear la primera reserva, pero sí para gestionar el ciclo de vida completo de sus reservas.

**Independent Test**: Con un usuario autenticado que ya tiene al menos una reserva futura y una pasada, puede probarse abriendo el panel "Mis Reservas", verificando que se listan por separado (o distinguibles) las reservas futuras y el historial pasado con cancha/fecha/hora, y cancelando una reserva futura para confirmar que desaparece de la lista de futuras y el bloque vuelve a estar "Disponible" en la grilla.

**Acceptance Scenarios**:

1. **Given** un usuario con sesión activa que tiene reservas futuras y pasadas, **When** abre su panel de "Mis Reservas", **Then** ve la lista de sus reservas futuras y su historial de reservas pasadas, cada ítem mostrando cancha, fecha y hora.
2. **Given** el panel de "Mis Reservas", **When** el usuario selecciona una reserva futura y confirma la cancelación, **Then** la reserva se cancela, deja de aparecer como reserva futura activa, y el bloque horario correspondiente vuelve a estar "Disponible".
3. **Given** el panel de "Mis Reservas", **When** el usuario intenta cancelar una reserva que ya pasó (parte del historial), **Then** el sistema no permite la cancelación de reservas pasadas.
4. **Given** un usuario con sesión activa, **When** consulta su panel de "Mis Reservas", **Then** solo ve sus propias reservas, nunca las de otros usuarios.

---

### Edge Cases

- ¿Qué sucede si un usuario intenta crear una nueva reserva mientras ya tiene una reserva activa pendiente (ver regla de una reserva activa a la vez)? → El sistema debe rechazar la nueva reserva con un mensaje claro explicando que ya tiene una reserva activa.
- ¿Qué sucede si dos usuarios confirman el mismo bloque horario casi simultáneamente? → Solo la primera confirmación en completarse la validación de disponibilidad se guarda; la segunda es rechazada con un mensaje de error claro (ver FR-011).
- ¿Qué sucede si la sesión del usuario expira mientras está en medio del flujo de reserva? → El sistema debe tratar la solicitud como no autenticada y solicitar iniciar sesión nuevamente antes de completar la reserva.
- ¿Qué sucede si un usuario intenta ver o cancelar una reserva que pertenece a otro usuario (por ejemplo, manipulando una URL o identificador)? → El sistema debe rechazar el acceso, ya que un usuario solo puede ver y gestionar sus propias reservas.
- ¿Qué sucede si un usuario selecciona una fecha pasada en el calendario? → El sistema no debe permitir seleccionar bloques horarios de fechas ya transcurridas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir que un visitante se registre con un correo electrónico y una contraseña para crear una cuenta de usuario.
- **FR-002**: El sistema MUST permitir que un usuario registrado inicie sesión con su correo electrónico y contraseña.
- **FR-003**: El sistema MUST restringir la visualización de la disponibilidad completa y la creación de reservas exclusivamente a usuarios con una sesión activa.
- **FR-004**: El sistema MUST asegurar que un usuario solo pueda ver y gestionar (cancelar) sus propias reservas, nunca las de otros usuarios.
- **FR-005**: El sistema MUST mostrar un listado estático de exactamente 5 canchas: Cancha Laureles, Cancha El Poblado, Cancha Belén, Cancha Robledo y Cancha Envigado.
- **FR-006**: El sistema MUST permitir al usuario seleccionar una fecha específica mediante un calendario para consultar la disponibilidad de una cancha.
- **FR-007**: El sistema MUST mostrar, para la cancha y fecha seleccionadas, una grilla de 24 bloques horarios de 1 hora cada uno (formato 24 horas).
- **FR-008**: El sistema MUST indicar claramente, para cada bloque horario de la grilla, si está "Disponible" o "Reservado".
- **FR-009**: El sistema MUST impedir que un usuario tenga más de una reserva activa (futura, no cancelada) al mismo tiempo en todo el sistema; el intento de crear una segunda reserva activa MUST ser rechazado con un mensaje claro.
- **FR-010**: El sistema MUST permitir que un usuario con sesión activa seleccione un bloque horario disponible y confirme la creación de una reserva sobre él.
- **FR-011**: El sistema MUST re-validar, en el momento de la confirmación, que el bloque horario seleccionado sigue disponible antes de persistir la reserva; si el bloque fue tomado por otro usuario en ese lapso, MUST rechazar la reserva con un mensaje de error claro y no debe escribirse una reserva duplicada para ese bloque.
- **FR-012**: El sistema MUST aceptar reservas únicamente en bloques horarios completos de 1 hora (por ejemplo, 14:00 a 15:00), sin permitir bloques parciales.
- **FR-013**: El sistema MUST impedir la creación de reservas en fechas u horarios que ya hayan transcurrido respecto al momento actual.
- **FR-014**: El sistema MUST proveer un panel donde el usuario pueda ver la lista de sus reservas futuras y su historial de reservas pasadas, separados o claramente distinguibles.
- **FR-015**: Cada ítem de la lista de reservas MUST mostrar el nombre de la cancha, la fecha y la hora de la reserva.
- **FR-016**: El sistema MUST permitir que un usuario cancele una reserva futura propia desde su panel, solicitando una confirmación explícita antes de ejecutar la cancelación.
- **FR-017**: El sistema MUST impedir la cancelación de reservas cuya fecha/hora ya haya transcurrido (historial pasado).
- **FR-018**: Al cancelar una reserva futura, el sistema MUST liberar el bloque horario correspondiente, dejándolo disponible nuevamente para otros usuarios.

### Key Entities *(include if feature involves data)*

- **Usuario**: Representa a una persona registrada en el sistema. Atributos clave: identificador, correo electrónico (único), contraseña (almacenada de forma segura), fecha de registro. Un usuario tiene cero o más reservas.
- **Cancha**: Representa una de las 5 instalaciones fijas del club (Laureles, El Poblado, Belén, Robledo, Envigado). Atributo clave: nombre. El catálogo es fijo e inmutable en esta iteración.
- **Reserva**: Representa la ocupación de una cancha por un usuario en un bloque horario específico. Atributos clave: cancha asociada, usuario asociado, fecha, hora de inicio/bloque, estado (activa/cancelada, futura/pasada). Cada reserva pertenece a un único usuario y a una única cancha.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo puede registrarse e iniciar sesión en menos de 2 minutos.
- **SC-002**: Un usuario con sesión activa puede consultar la disponibilidad de una cancha para una fecha y confirmar una reserva sobre un bloque disponible en menos de 1 minuto.
- **SC-003**: El 100% de los intentos de reserva sobre un bloque horario ya ocupado son rechazados antes de escribirse en el sistema; nunca se produce una doble reserva sobre el mismo bloque de la misma cancha.
- **SC-004**: El 100% de los bloques horarios mostrados en la grilla reflejan con precisión el estado real (Disponible/Reservado) en el momento de la consulta.
- **SC-005**: Un usuario puede localizar y cancelar una reserva futura propia desde su panel en menos de 3 pasos (abrir panel, seleccionar reserva, confirmar cancelación).
- **SC-006**: El 100% de los intentos de acceso a disponibilidad completa o creación de reservas sin sesión activa son bloqueados.

## Assumptions

- No se requiere verificación de correo electrónico durante el registro, dado que el alcance explícitamente excluye notificaciones externas (correos transaccionales).
- La sesión de usuario utiliza un mecanismo estándar basado en sesión/cookie o token; no se especifica un método particular de autenticación adicional (SSO, 2FA, etc.) porque no fue solicitado.
- El club opera las 24 horas para efectos de la grilla de reservas; no existen restricciones de horario de apertura/cierre distintas a las 24 bloques horarios ya definidos.
- No existe un período mínimo de antelación para cancelar una reserva futura; puede cancelarse en cualquier momento antes de su hora de inicio.
- El pago de la reserva se gestiona presencialmente en el club y está fuera del alcance de esta especificación, según los non-goals declarados.
- El idioma de la interfaz es español, consistente con la descripción funcional proporcionada.
