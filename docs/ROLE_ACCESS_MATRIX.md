# Role Access Matrix

This matrix summarizes the role vocabulary used by the workforce app in the frontend.

| Backend role | Scope | Main capabilities |
| --- | --- | --- |
| `ROLE_SUPER_ADMIN` | All tenants | Full administration of companies, users, employees, locations, calendars, schedules, policies, reports, and platform settings |
| `ROLE_COMPANY_ADMIN` | Own tenant | Operational management of the company, including employees, locations, users, schedules, and configuration |
| `ROLE_RRHH` | Own tenant | HR operations, employee records, absences, permissions, incidents, and reporting |
| `ROLE_MANAGER` | Assigned scope | Read/write access limited to the operational scope assigned by the backend |
| `ROLE_USER` | Own profile | Self service, time entries, schedule view, and personal requests |
| `ROLE_AUDITOR` | Read-only assigned scope | Auditing, traceability, and reporting without write access |
| `ROLE_WORKFORCE_REPRESENTATIVE` | Read-only assigned scope | Workforce representation and consultation without write access |

## Frontend rules

- Navigation must be filtered by role and current scope.
- The UI must never expose actions the backend would reject.
- Company-specific selectors must come from scoped API responses, not from browser-side filtering of global lists.
- Mobile and desktop navigation should share the same authorization rules.
- Empty states and forbidden states must remain readable and consistent with the selected role.
