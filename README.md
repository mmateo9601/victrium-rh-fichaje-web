# victrium-rh-fichaje-web

Frontend Next.js de `Victrium RH` para operar con `victrium-rh-fichaje-api`.

## Resumen

- Next.js + React + TypeScript
- App Router
- Cliente de API tipado y generado localmente
- Interfaz corporativa, responsive y sin Docker
- Integración exclusiva con la API por `NEXT_PUBLIC_API_URL`
- Roles soportados: `ROLE_SUPER_ADMIN`, `ROLE_COMPANY_ADMIN`, `ROLE_RRHH`, `ROLE_MANAGER`, `ROLE_USER`, `ROLE_AUDITOR`, `ROLE_WORKFORCE_REPRESENTATIVE`

## Requisitos

- Node.js 20 o superior
- npm

## Entorno

1. Copia `.env.example` a `.env.local` para desarrollo.
2. Configura la URL base de la API.
3. En producción, inyecta la misma variable desde el hosting.

Variable disponible:

- `NEXT_PUBLIC_API_URL`

Notas:

- La ruta `/api/v1` la añade el cliente automáticamente.
- `NEXT_PUBLIC_*` se embebe en el bundle en tiempo de build.

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm ci
npm run build
npm run start
```

## Verificación

```bash
npm run lint
npm test
npm run build
```

## Cliente API

Generación local del cliente tipado:

```bash
npm run api
```

Alias disponible:

```bash
npm run api:generate
```

## Estructura principal

- `src/app`
- `src/components`
- `src/lib`
- `src/hooks`
- `src/styles`
- `public`
- `docs`

## Páginas principales

- `/`
- `/login`
- `/dashboard`
- `/companies`
- `/users`
- `/employees`
- `/employees/[id]`
- `/vacations`
- `/incidents`
- `/incidents/[id]`
- `/calendars`
- `/calendars/[id]`

## Documentación

- [Frontend production env](docs/FRONTEND_PRODUCTION_ENV.md)

## Notas de entrega

- No contiene infraestructura Docker.
- El diseño prioriza claridad, jerarquía visual y uso corporativo en escritorio y móvil.
