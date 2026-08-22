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
