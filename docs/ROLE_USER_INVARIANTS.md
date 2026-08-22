# ROLE_USER Invariants

Fecha de referencia: 2026-08-22

## Propósito

Definir las reglas que no pueden romperse para el rol `ROLE_USER` en el frontend y en el flujo de cronómetro.

## Invariantes funcionales

- `ROLE_USER` solo debe ver navegación de autoservicio.
- `ROLE_USER` no debe ver ni acceder a CRUD de empresas, empleados, centros, turnos, calendarios globales, planificación, API keys ni paneles de administración.
- El cronómetro de usuario debe consultar siempre la elegibilidad calculada por backend.
- El inicio de jornada no puede depender de la hora del navegador.
- La ventana de fichaje temprano se rige por la política de empresa.
- La jornada no puede iniciarse si la API responde que está fuera de ventana, ya existe una jornada activa, la jornada de hoy ya está cerrada o el empleado está inactivo.
- La pausa solo puede ejecutarse sobre una jornada activa.
- La reanudación solo puede ejecutarse sobre una jornada en pausa.
- La finalización debe cerrar la sesión activa y dejarla en estado `COMPLETED`.
- La vista de `Mi jornada` debe mostrar estados humanos y no códigos internos como única referencia.
- La navegación móvil debe ser utilizable, cerrar al cambiar de ruta y no bloquear la interacción principal.

## Invariantes de datos

- Las respuestas de `GET /api/v1/time-entries/me/current` deben incluir `eligibility`.
- `GET /api/v1/time-entries/me/eligibility` debe ser la fuente de verdad para habilitar o no el botón de entrada.
- El frontend no debe inventar reglas de acceso ni calcular la ventana de entrada por su cuenta.
- El backend no debe permitir que `ROLE_USER` vea datos de otros usuarios fuera de su alcance.

## Invariantes de UX

- Si no se puede fichar todavía, la interfaz debe decirlo con un mensaje claro.
- Si el usuario ya terminó la jornada de hoy, la interfaz debe mostrarlo y no seguir ofreciendo una acción inválida.
- El botón principal de fichaje debe quedar deshabilitado cuando el backend indique que no se puede iniciar la jornada.
- La navegación de usuario debe permanecer limpia en móvil y escritorio, con acciones visibles y sin mezclar menús de gestión.

