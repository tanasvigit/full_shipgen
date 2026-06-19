# Smart Yard — Playwright Audit Suite

Automated exploration of the YMS frontend: routes, buttons, drawers, forms, API failures, console errors, global search, and RBAC.

## Prerequisites

1. Stack running (from `yard_frontend/`):

   ```bash
   docker compose up -d
   ```

2. Verify:
   - Frontend: http://localhost:3001
   - Backend: http://localhost:8001

## Install & run

```bash
cd yard_frontend/e2e
npm install
npm run install:browsers
npm run audit
```

Optional:

```bash
npm run audit:headed   # visible browser
npm run report         # regenerate PLAYWRIGHT_AUDIT_REPORT.md from JSON
```

## Outputs

| Artifact | Location |
|----------|----------|
| Markdown report | `PLAYWRIGHT_AUDIT_REPORT.md` (repo root) |
| Raw results | `yard_frontend/e2e/audit-results.json` |
| Screenshots | `yard_frontend/e2e/screenshots/` |
| HTML report | `yard_frontend/e2e/playwright-report/index.html` |

## Environment

| Variable | Default |
|----------|---------|
| `YMS_FRONTEND_URL` | `http://localhost:3001` |
| `YMS_API_URL` | `http://localhost:8001` |

## Routes

Tests all paths from `frontend_1/src/App.js` plus doc aliases (`/dashboard`, `/virtual-queue`, etc.) recorded as WARN when unrouted.

Default role for audit: `operations` (via `localStorage` init script). RBAC section switches roles via TopNav `data-testid="role-{role}"`.

## Policy

- Does **not** stop on first failure; collects full defect list.
- Skips destructive submits (book slot submit, gate approve, logout) in blind button sweep; covered in dedicated form/drawer sections where safe.
