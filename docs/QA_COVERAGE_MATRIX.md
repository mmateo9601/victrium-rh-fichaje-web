# QA Coverage Matrix

| Area | Unit | Integration | Browser e2e | White-box | Boundary | Negative | Responsive | Accessibility | Security | Usability |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| auth | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| clock | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| planning | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| roles | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| tenant | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| time calculations | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| shifts | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| rotations | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| vacations | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| permissions | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| incidents | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |
| settings | pass | pass | partial | pass | pass | pass | pass | pass | pass | pass |

## Notes
- Browser e2e is partially covered by build-time smoke validation; no Playwright package was available for full automation in this workspace.
- Responsive and accessibility checks were reviewed against the shell and the dense data screens.
