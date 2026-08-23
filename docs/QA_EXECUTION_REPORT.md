# QA Execution Report

Fecha: 2026-08-23

## Tests executed
- `& .\node_modules\.bin\vitest.cmd run`
- `& .\node_modules\.bin\eslint.cmd . --ext .ts,.tsx,.mjs`
- `& .\node_modules\.bin\next.cmd build`

## Results
- Vitest: 6 files, 17 tests, all passing.
- ESLint: passing.
- Next build: passing.

## Additional verification
- Validated the production build route map after the role access fix.
- Started the built app locally for a browser smoke, but full Playwright automation was not available in the workspace.

## Browser analysis on production
- Reviewed `https://victrium-rh-fichaje-web.victriumtech.com/` in headless Chrome at desktop and mobile sizes.
- Verified the public landing page and login page hierarchy, spacing, typography, and CTA ordering.
- Authenticated and inspected these production accounts:
  - `platform@victrium.local` -> `ROLE_SUPER_ADMIN`
  - `admin@victrium.local` -> `ROLE_ADMIN`
  - `company-admin@victrium.local` -> `ROLE_COMPANY_ADMIN`
  - `rrhh@victrium.local` -> `ROLE_RRHH`
  - `laura@victrium.local` -> `ROLE_USER`
  - `admin@acme.local` -> `ROLE_ADMIN`
  - `company-admin@nexa.local` -> `ROLE_COMPANY_ADMIN`
  - `operations@acme.local` -> `ROLE_USER`
  - `alba@nexa.local` -> `ROLE_USER`
- Confirmed that role-filtered navigation and access control are working from the browser:
  - `ROLE_USER` only sees self-service entries.
  - `ROLE_COMPANY_ADMIN` sees tenant operations but not `Usuarios`, `Empresas` or `Claves`.
  - `ROLE_RRHH` sees the broader HR set, including `Usuarios`.
  - `ROLE_ADMIN` and `ROLE_SUPER_ADMIN` see the full management shell.
- Confirmed that direct URL access to restricted areas redirects `ROLE_USER` to `/forbidden` with an access-denied message.
- Observed a production issue in `Mi jornada`: the page shows a persistent skeleton/partial shell and `Failed to fetch` because the backend responds with `503` on the `time-entries/me` calls.
