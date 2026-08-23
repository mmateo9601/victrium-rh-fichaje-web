# UX Complexity Audit

## High-complexity surfaces
- `/time-entries` is the densest screen: timer, chart, calendar, filters and tables all compete for attention.
- `/incidents`, `/permissions` and `/vacations` mix self-service and management views, which raises cognitive load when role state changes.
- `/shifts`, `/planning-periods` and `/reports` are operationally heavy and benefit from strong progressive disclosure.

## What works well
- The shell keeps navigation visible and role-filtered.
- Mobile navigation is explicit and easy to close.
- Primary actions are usually placed near the relevant content, which reduces hunting.

## UX risks
- Long tables can feel heavy on smaller screens even when the responsive layout is correct.
- Management sections can silently disappear for some roles, so inline explanations need to stay clear.
- Dense data entry forms on incidents and permissions should keep validation feedback immediate and human-readable.
- The login screen uses a long split-screen hero on mobile, which pushes the form below the first viewport and delays the primary task.

## Browser observations
- Desktop login and homepage have a strong visual hierarchy, consistent brand treatment, and readable contrast.
- Mobile homepage keeps the CTA visible and preserves the visual language well.
- Mobile login is the weakest responsive surface: the hero occupies the first screen and the actual form starts below the fold.
- Multi-role browser validation on production showed a coherent role ladder:
  - `ROLE_USER` gets a compact self-service menu.
  - `ROLE_COMPANY_ADMIN` gets the operational tenant shell without global admin items.
  - `ROLE_RRHH` expands to people management and user administration.
  - `ROLE_ADMIN` and `ROLE_SUPER_ADMIN` add the full platform set.
- `Mi jornada` is visually consistent with the rest of the shell, but the screen never fully resolves on production because the backend responds with `503` on its primary data calls.

## Audit result
- The clearest UX regression is still the mobile login layout.
- The clearest functional blocker in the browser is `Mi jornada` loading failure on production.
- Outside that failure, the shell and role-based hierarchy are coherent and predictable.
