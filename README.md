# victrium-rh-fichaje-web

Frontend corporativo en Next.js para `Victrium RH`.

## Overview

Aplicación web de acceso único para operación diaria, planificación, fichaje y administración de personas.

## Stack

- Next.js 15
- React 19
- TypeScript
- App Router
- Cliente API tipado y generado localmente
- UI responsive con patrón corporativo

## Requirements

- Node.js 20 o superior
- npm

## Environment

Copy `.env.example` to `.env.local` for local development and set:

- `NEXT_PUBLIC_API_URL`

Notes:

- The frontend appends `/api/v1` automatically.
- `NEXT_PUBLIC_*` variables are baked into the client bundle at build time.
- Keep the production value aligned with the deployed API domain.

## Quick Start

```bash
npm install
npm run dev
```

## Production

```bash
npm ci
npm run build
npm run start
```

## Quality Gates

```bash
npm run lint
npm test
npm run build
```

## API Client Generation

```bash
npm run api:generate
```

Shortcut:

```bash
npm run api
```

## Main Routes

- `/`
- `/login`
- `/dashboard`
- `/time-entries`
- `/my-calendar`
- `/schedule`
- `/shifts`
- `/companies`
- `/work-locations`
- `/calendars`
- `/planning-periods`
- `/users`
- `/employees`
- `/vacations`
- `/permissions`
- `/incidents`

## Project Structure

- `src/app`
- `src/components`
- `src/lib`
- `src/hooks`
- `src/styles`
- `public`
- `docs`
- `scripts`

## Documentation

- [Frontend production env](docs/FRONTEND_PRODUCTION_ENV.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Visual gallery](docs/screenshots/README.md)

## Related Repository

- API: [victrium-rh-fichaje-api](https://github.com/mmateo9601/victrium-rh-fichaje-api)

## Publication Notes

- No Docker artifacts are included in this repository.
- No real credentials should be committed.
- The repository is ready for GitHub with a clean README, reproducible local setup, and environment variable contract.
