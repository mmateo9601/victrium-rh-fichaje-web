# victrium-rh-fichaje-web

Frontend Next.js para consumir `victrium-rh-fichaje-api` de forma independiente.

## Requisitos

- Node.js 20 o superior
- npm

## Variables de entorno

Usa `.env.example` como referencia.

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

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
