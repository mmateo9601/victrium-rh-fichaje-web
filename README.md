# victrium-rh-fichaje-web

Frontend Next.js para consumir `victrium-rh-fichaje-api` de forma independiente.

## Requisitos

- Node.js 20 o superior
- npm

## Variables de entorno

Usa `.env.example` como referencia y cópialo a `.env.local` para desarrollo local.

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

La configuración tipada vive en [`src/lib/config/env.ts`](src/lib/config/env.ts).

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

## Estado

Base inicial sin infraestructura Docker. La migracion funcional de pantallas y autenticacion continuara a partir de esta estructura.
