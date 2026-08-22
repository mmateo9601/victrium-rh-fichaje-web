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
En producción, el sitio usa la variable de entorno publicada por Hostinger/Sites.

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
  - Desarrollo local: `http://localhost:3001/api/v1`
  - Producción: `https://victrium-rh-fichaje-api.victriumtech.com/api/v1`

La configuración tipada vive en [`src/lib/config/env.ts`](src/lib/config/env.ts).

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
npm install
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

- La API base debe apuntar a `/api/v1`.
- Las pantallas de calendario, turnos y fichajes asumen que el backend ya expone Swagger y el cliente generado.
