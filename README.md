# victrium-rh-fichaje-web

Frontend Next.js para consumir `victrium-rh-fichaje-api` de forma independiente.

## Estado actual

- Next.js + React + TypeScript
- App Router
- Cliente tipado para la API
- Login, dashboard, companies, users, employees, vacations, incidents y calendars
- Soporte de detalle y edición de empleados
- Responsive
- Sin Docker

## Requisitos

- Node.js 20 o superior
- npm

## Variables de entorno

Usa `.env.example` como referencia y cópialo a `.env.local` para desarrollo local.
En producción, Hostinger/Sites debe inyectar la misma variable.

- `NEXT_PUBLIC_API_URL=https://api.example.com`

La configuración tipada vive en [`src/lib/config/env.ts`](src/lib/config/env.ts).
La URL se consume como origen de API y el cliente añade internamente la ruta `/api/v1`.
Como variable `NEXT_PUBLIC_*`, queda embebida en el bundle en build time.

## Cliente API

El cliente tipado se genera localmente con:

```bash
npm run api
```

El alias `api` ejecuta:

```bash
npm run api:generate
```

El script escribe [`src/lib/api/generated.ts`](src/lib/api/generated.ts) a partir del template incluido en el repositorio.

## Desarrollo

```bash
npm ci
npm run dev
```

## Produccion

```bash
npm ci
npm run build
npm run start
```

## Verificacion

```bash
npm run lint
npm test
npm run build
```

## Produccion

```bash
npm ci
npm run build
npm run start
```

## Comando de build

- `npm ci`
- `npm run build`

## Node

- Validado con Node.js 24 en este entorno.
- Soporte declarado en `package.json`: `>=20`.

## Rutas principales

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

## Integracion

- La API base se define por `NEXT_PUBLIC_API_URL`.
- La ruta `/api/v1` la añade el cliente tipado.
- Las pantallas de calendario, turnos y fichajes asumen que el backend ya expone Swagger y el cliente generado.
