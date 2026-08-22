# FRONTEND_PRODUCTION_ENV

Fecha de revisión: 2026-08-22

## Variables requeridas

| Variable | Required | Public | Purpose | Example | Build/Runtime |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Yes | Origen del backend API que consume el frontend. El cliente añade internamente `/api/v1`. | `https://api.example.com` | Build y runtime en el navegador |

## Notas

- No hay variables `server-only` obligatorias definidas por este frontend en el estado actual.
- Toda variable `NEXT_PUBLIC_*` queda embebida en el bundle durante el build.
- Cambiar una variable `NEXT_PUBLIC_*` después de compilar no modifica un bundle ya generado.
- `NEXT_PUBLIC_API_URL` no debe apuntar a `localhost` ni a HTTP en producción.

## Consistencia

- La definición tipada vive en [`src/lib/config/env.ts`](../src/lib/config/env.ts).
- La variable documentada aquí debe coincidir con `.env.example` y con la configuración de Hostinger.
