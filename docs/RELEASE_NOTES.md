# Release Notes

## Current Delivery

This frontend repository is organized as a corporate Next.js application for Victrium RH.

## What is Included

- Corporate login and authenticated shell
- Role-aware navigation and layout
- Core operational views such as dashboard, users, employees, shifts, and schedule
- Responsive presentation for desktop and mobile usage
- Environment contract documented in `FRONTEND_PRODUCTION_ENV.md`
- Cross-reference to the API repository
- Visual gallery with the main user flows in `docs/screenshots/`

## Operational Notes

- The frontend expects the API endpoint to be configured through environment variables.
- No Docker artifacts are stored in this repository.
- Screenshots are published for documentation purposes and are redacted to avoid exposing sensitive information.

## Reviewer Checklist

- Install dependencies with `npm install`
- Run the app with `npm run dev`
- Validate lint and build before release
- Confirm the API domain configured in the environment matches the deployed backend

## Related Repositories

- API: `victrium-rh-fichaje-api`

