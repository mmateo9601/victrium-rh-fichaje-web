# FRONTEND UX AUDIT

Fecha de revisión: 2026-08-22

Alcance revisado:
- `Login`
- `Dashboard`
- `WorkTimer`
- `Mi planificación`
- `Planificación RRHH`
- `Cuadrante`
- `Fichajes`
- `Vacaciones`
- `Permisos`
- `Incidencias`
- `Employees`
- `Users`
- `Companies`
- `WorkLocations`
- `Shifts`
- `PlanningPeriods`
- `Profile`
- `Notifications`

Estado ejecutivo:
- La base visual es sólida, consistente y responsive.
- La navegación cubre los flujos principales de autoservicio y gestión.
- El frontend respeta la autoridad del backend para permisos y estado.
- Se corrigieron varios residuos de idioma técnico y etiquetas en inglés visibles al usuario.
- Siguen existiendo algunos pendientes de accesibilidad y cobertura funcional que conviene cerrar.

## DESIGN SYSTEM

- La interfaz usa un lenguaje visual homogéneo: superficies elevadas, bordes suaves, jerarquía clara y acciones primarias bien diferenciadas.
- `src/app/globals.css` define un sistema de espaciado, radios, sombras y estados que se replica en todas las vistas.
- `FullCalendar` está integrado con estilos propios y no rompe la línea visual del producto.
- La tipografía y el contraste son adecuados para una app de uso operativo.
- Se mantiene la separación entre vistas densas de tabla y vistas visuales de calendario, lo cual evita sobrecargar al usuario.

## NAVIGATION

- La navegación lateral agrupa bien por intención: inicio, personas, ausencias y organización.
- La topbar resuelve correctamente el título contextual de cada ruta.
- Se corrigió la etiqueta visible `Reports` para mostrar `Informes`.
- La navegación móvil funciona y puede cerrarse con overlay, botón y `Escape`.
- Falta una capa más clara de “dónde estoy” en pantallas profundas, especialmente en detalles con mucha densidad.

## ROLE UX

- El frontend no decide permisos como fuente de verdad; solo adapta la UI según la sesión.
- La lógica de acceso de gestión se basa en helpers reutilizables, no en decisiones aisladas por pantalla.
- Se normalizaron roles visibles para no mostrar identificadores técnicos en el UI.
- Se corrigieron los roles visibles en:
- `Dashboard`
- `Profile`
- `Users`
- `Employees`
- `Vacations`
- `Permissions`
- `Incidencias`
- `Calendars`
- `PlanningPeriods`
- `Shifts`
- También se normalizaron exportaciones CSV para no exponer roles crudos.
- Sugerencia: mantener el mismo criterio para cualquier vista nueva de administración o exportación.

## RESPONSIVE

- La base responsive es correcta y usa cortes razonables para escritorio, tablet y móvil.
- El shell principal pasa de layout de dos columnas a una sola columna en anchos menores.
- La navegación lateral se convierte en drawer móvil con overlay.
- Los paneles, tablas y calendarios reducen correctamente su densidad visual en pantallas estrechas.
- El código está preparado para los anchos solicitados: `390`, `768`, `1280` y `1440`.
- Pendiente: validación visual manual específica en esos cuatro anchos para confirmar que no haya cortes, overflow o CTA truncados.

## ACCESSIBILITY

- Hay `skip link`, foco visible y uso consistente de `label` en formularios.
- Los calendarios y los modales tienen una base razonable de semántica ARIA.
- Se controla el scroll del body cuando la navegación móvil está abierta.
- Pendiente importante: reforzar el comportamiento de los diálogos con trap de foco real y cierre por `Escape` en todos los casos.
- Pendiente importante: revisar todos los estados vacíos y de error para que sean siempre inequívocos para lector de pantalla.
- Pendiente menor: revisar textos de ayuda y `aria-label` para que todo el contenido no visual siga también en español.

## BUGS FIXED

- Se corrigió la etiqueta visible `Reports` para pasar a `Informes`.
- Se normalizaron roles visibles con `getRoleListLabel(...)` y `getRoleLabel(...)`.
- Se eliminó la exposición de roles crudos en varias pantallas administrativas.
- Se normalizaron exportaciones CSV de usuarios y empleados para evitar enums técnicos.
- Se corrigió un error de tipos que afectaba al build en el detalle de empleado.
- Se mantuvo la lógica de cronómetro con textos humanos y estados comprensibles.

## TESTS

- `node node_modules\\eslint\\bin\\eslint.js . --ext .ts,.tsx,.mjs`
- `node node_modules\\vitest\\vitest.mjs run`
- `node node_modules\\next\\dist\\bin\\next build`

Resultado:
- `eslint`: OK
- `vitest`: 6 archivos, 17 tests OK
- `next build`: OK

Nota de entorno:
- `npm run lint` no pudo ejecutarse en este shell porque el shim global de `npm` apunta a una ruta inexistente.
- Se validó el equivalente local con los binarios del proyecto y el resultado fue correcto.

## PENDING

- Verificación visual real en `390`, `768`, `1280` y `1440`.
- Cerrar el trap de foco en diálogos de confirmación y detalle.
- Revisar si las pantallas de `Settings` y `Notifications` deben existir en este frontend o quedar explícitamente fuera de alcance.
- Mejorar consistencia de estados vacíos en listados largos con más contexto accionable.
- Evaluar si la vista de calendario anual aporta valor real en todos los perfiles o si conviene reducirla a día, semana, mes y agenda.
- Completar una pasada final de accesibilidad sobre `aria-label`, ayuda contextual y manejo de teclado.
