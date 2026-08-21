# FullCalendar Standard en `victrium-rh-fichaje-web`

Este proyecto usa FullCalendar únicamente como capa de presentación en el frontend.

## Paquetes permitidos

- `@fullcalendar/react`
- `@fullcalendar/core`
- `@fullcalendar/daygrid`
- `@fullcalendar/timegrid`
- `@fullcalendar/interaction`
- `@fullcalendar/list`
- `@fullcalendar/multimonth`

## Reglas

- No usar `scheduler`, `premium`, `resource`, `timeline` ni licencias `schedulerLicenseKey`.
- No añadir infraestructura Docker para esta funcionalidad.
- No depender de CDNs ni servicios externos de calendario.
- Mantener tablas y exportaciones cuando aporten más detalle que la vista visual.

## Vistas donde se usa

- `Mi planificación`
- `Planificación`
- `Planificación de empleado`
- `Calendario laboral`
- `Vacaciones`
- `Permisos`
- `Fichajes`

## Modelo compartido

La transformación de datos a eventos vive en `src/lib/calendar.ts`.
Ese módulo normaliza:

- turnos;
- vacaciones;
- permisos;
- fichajes;
- periodos de calendario;
- periodos de planificación.

## Estilo visual

`src/app/globals.css` contiene la personalización del calendario para integrarlo con el resto del sistema de diseño.
