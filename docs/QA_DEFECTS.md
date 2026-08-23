# QA Defects

## WEB-001: ROLE_COMPANY_ADMIN could enter incidents detail but not resolve it
- Severity: High
- Status: Fixed
- Impact: the UI treated company admins as management on the incidents list, but the detail page hid the resolve action and the API originally rejected the route.
- Fix: aligned the incidents detail page role check and expanded the API role gates.

## WEB-002: Browser e2e tooling not available locally
- Severity: Low
- Status: Documented
- Impact: no Playwright package was present, so we could not run a true browser automation suite from this workspace.

## WEB-003: Login form is below the fold on mobile
- Severity: Medium
- Status: Open
- Impact: on a 390x844 viewport, the login hero consumes the entire first screen and the form starts below the fold, so the primary task is delayed and the user has to scroll before authenticating.
- Evidence: desktop and mobile browser captures of the public login page show the form starting at roughly 846px from the top on mobile.

## WEB-004: Login error messages reveal whether an email exists
- Severity: Medium
- Status: Open
- Impact: the login surface returns `Usuario no encontrado` for unknown emails, which leaks account existence and enables user enumeration.
- Evidence: repeated browser login attempts with documented addresses on the live deployment produced the account-existence error instead of a generic authentication failure.

## WEB-005: Mi jornada fails to load due to backend 503
- Severity: High
- Status: Open
- Impact: `ROLE_USER` reaches `/time-entries`, but the screen stays on a loading shell and surfaces `Failed to fetch` because the backend returns `503` for `GET /api/v1/time-entries/me` and `GET /api/v1/time-entries/me/current`.
- Evidence: browser network tracing on the production site showed repeated `503` responses for the time-entries endpoints while the page remained on `/time-entries`.
