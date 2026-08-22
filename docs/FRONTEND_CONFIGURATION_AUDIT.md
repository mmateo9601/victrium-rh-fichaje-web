# FRONTEND_CONFIGURATION_AUDIT

Fecha de revisión: 2026-08-22

## ENV

- `NEXT_PUBLIC_API_URL`: única variable de entorno pública requerida por el frontend.

## DB/API-driven

- Empresas, usuarios, empleados, turnos, calendarios, periodos de planificación, ausencias, permisos, incidencias y fichajes se resuelven desde la API.
- Los estados visibles al usuario se obtienen del backend y se traducen a etiquetas humanas en el frontend.
- La autoría de permisos y estados de gestión sigue en backend.

## USER PREFERENCE

- Búsquedas y filtros de listados.
- Paginación visible.
- Fecha/rango seleccionado en calendarios.
- Drawer de navegación móvil abierto/cerrado.
- Vista activa de FullCalendar en las pantallas que lo usan.

## HARDCODED CONSTANT

- Claves internas de sesión en `localStorage` y evento de sincronización en `src/lib/auth/session.ts`.
- Labels de navegación, títulos de secciones y textos UI estáticos.
- Estados visuales de FullCalendar Standard.
- Layout y tokens de diseño en `src/app/globals.css`.
- `SESSION_KEY` y `SESSION_EVENT` son constantes de aplicación, no secretos.

## Limpieza aplicada

- Se eliminó `playwright-core` del árbol de dependencias al no aparecer usado en código ni scripts.
- Se centralizó el acceso a la API en `src/lib/config/env.ts`.
- Se simplificó la construcción de URL del cliente API para depender de una sola base central.
- Se normalizaron etiquetas visibles que seguían mostrando `Reports` o roles técnicos.

## Riesgo residual

- No se ha detectado configuración duplicada de API base en el código de aplicación.
- La única exposición pública prevista es `NEXT_PUBLIC_API_URL`.
- El frontend todavía conserva constantes de UI razonables que no representan riesgo de despliegue.
