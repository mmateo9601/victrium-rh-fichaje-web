# Role Access Matrix

This matrix summarizes the backend role vocabulary used by the workforce app.

| Backend role | Scope | Main capabilities |
| --- | --- | --- |
| `ROLE_SUPER_ADMIN` | All tenants | Create and manage companies, users, employees, calendars, schedules, policies, and operational data across tenants |
| `ROLE_COMPANY_ADMIN` | Own tenant | Manage operational data for the company, including employees, locations, schedules, and planning |
| `ROLE_RRHH` | Own tenant | HR operations, employee records, absences, permissions, incidents, and reporting |
| `ROLE_USER` | Own profile | Self service, time entries, schedule view, personal absences and employee context |

## Guard rules already enforced

- tenant scoping is always applied before data access
- `ROLE_SUPER_ADMIN` cannot be assigned by non-super-admin actors
- employee and company resources are resolved against the authenticated tenant
- self-service endpoints remain available to the authenticated employee context

## Frontend alignment

The web navigation must be filtered by role and scope so that each user only sees:

- the modules they can actually access
- the actions they can perform in the current tenant
- the correct mobile and desktop navigation state
