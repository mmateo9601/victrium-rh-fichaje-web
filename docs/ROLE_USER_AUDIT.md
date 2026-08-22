# ROLE_USER Audit

Fecha de revisión: 2026-08-22

## Objetivo

Revisar y cerrar el recorrido funcional de `ROLE_USER` en el frontend, con foco en:

- navegación real de autoservicio;
- visibilidad de estados en lenguaje humano;
- acceso a detalle propio;
- comportamiento del cronómetro;
- coherencia móvil y escritorio;
- separación clara entre vistas de usuario y vistas de gestión.

## Cambios aplicados

- Unifiqué el criterio de acceso de gestión con `hasManagementAccess(...)`.
- Actualicé el panel principal para que `ROLE_SUPER_ADMIN` no caiga en un flujo de empleado.
- Traducí estados de vacaciones y permisos para no mostrar códigos técnicos como valor principal.
- Ajusté textos visibles de `Permisos` para mantener el idioma de la interfaz.
- Hice más robusto `WorkTimer` para que una consulta secundaria de horario no bloquee el reloj principal.
- Normalicé textos de dashboard y exportaciones para mostrar etiquetas humanas.
- Mantengo la separación por roles en la navegación y en los botones de gestión.
- Corregí la hidratación de la barra superior para que la sesión de `localStorage` no genere mismatch entre SSR y cliente.

## Verificaciones realizadas

- `npm run lint` en `victrium-rh-fichaje-web`: correcto.
- `npm run build` en `victrium-rh-fichaje-web`: correcto.
- Navegador local con `npm run dev`:
  - login de `ROLE_USER` con `laura@victrium.local` y `Victrium123!`;
  - recorrido de `/dashboard`, `/time-entries`, `/my-calendar`, `/vacations`, `/permissions`, `/incidents` y `/profile`;
  - validación de menú móvil abierto y cerrado;
  - validación de cierre de sesión en navegador local.

## Puntos revisados para `ROLE_USER`

- `/dashboard`
- `/time-entries`
- `/my-calendar`
- `/vacations`
- `/permissions`
- `/incidents`
- `/profile`

## Resultado funcional

`ROLE_USER` conserva:

- inicio de jornada y pausa/reanudación/finalización desde el cronómetro;
- consulta de sus fichajes;
- solicitud de vacaciones, permisos e incidencias;
- acceso a su calendario personal;
- acceso al perfil propio y cambio de contraseña;
- navegación limitada a vistas de autoservicio.

## Hallazgos locales

- La navegación móvil abre y muestra correctamente las opciones de autoservicio.
- La salida de sesión funciona en local y deja la sesión vacía.
- Ya no se observó el mismatch de hidratación de la barra superior tras sincronizar la sesión.
- No se detectaron códigos técnicos visibles en vacaciones, permisos ni calendario durante el recorrido local.
