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

## Audit result
- No blocker UX issue remains after the company-admin access alignment.
- Main remaining complexity is information density, not broken navigation.
