# Release Checklist

Use this checklist before publishing the frontend repository.

## Source Control

- Working tree is clean.
- No real secrets are present in the repo.
- `.env.local` is ignored and `.env.example` is the only committed environment template.

## Local Validation

```bash
npm install
npm run lint
npm test
npm run build
```

## Runtime Contract

- `NEXT_PUBLIC_API_URL` points to the deployed API domain.
- The frontend uses the API only through `/api/v1`.
- The public environment contract matches `docs/FRONTEND_PRODUCTION_ENV.md`.

## Production Readiness

- Login works with the current backend.
- Role-based navigation hides unauthorized modules.
- Mobile and desktop layouts are both usable.
- No Docker files or Docker-related scripts are included.
