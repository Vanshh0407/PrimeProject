# PrimeProjects

A PSA (Professional Services Automation) platform: projects, phases, timesheets, approvals,
billing/invoicing, and two-way Odoo Community Edition synchronization.

## Structure

```
backend/               Django REST API (projects, phases, timesheets, billing/invoicing)
frontend/              Next.js + Material UI web app
integration-service/   Node.js Odoo JSON-RPC adapter + invoice sync queue worker
odoo/addons/primeprojects/   Custom Odoo module (mapping fields, sync log, cron scaffold)
docker-compose.yml      Runs everything together
```

## Ports

| Service | Port |
|---|---|
| Frontend (Next.js) | 3007 |
| Backend (Django API) | 8007 |
| Integration service (Node/Odoo adapter) | 8090 |
| Odoo | 8069 |
| Postgres (app DB) | 5432 |

## Configuration

All secrets and config live in `.env` at the project root (gitignored, never committed).
Copy `.env.example` to `.env` and fill in real values before first run:

```bash
cp .env.example .env
```

Every service fails loudly on startup if a required variable is missing — there are no
hardcoded fallback secrets anywhere in the code.

## Run everything with Docker

```bash
docker compose up -d --build
```

This starts Postgres, the Django API, the Next.js frontend, the Node integration service,
the invoice sync queue worker, and Odoo (with its own dedicated Postgres instance).

- Frontend: http://localhost:3007
- Backend API: http://localhost:8007
- Odoo: http://localhost:8069

### One-time Odoo setup

1. Open http://localhost:8069, create a database named exactly `primeprojects` (must match
   `ODOO_DB` in `.env`), and set an admin email/password (must match `ODOO_ADMIN_LOGIN` /
   `ODOO_ADMIN_PASSWORD` in `.env`).
2. Install the prerequisite apps: **Employees**, **Project**, **Invoicing**.
3. Enable Developer Mode (Settings → Developer Tools) and run **Apps → Update Apps List**.
4. Clear the "Apps" filter, search **"PrimeProjects PSA"**, and click **Install**.

### First backend login

Create a Django user to log into the frontend:

```bash
docker compose exec backend python manage.py createsuperuser
```

Or set `DEMO_USERNAME` / `DEMO_PASSWORD` in `.env` to power the frontend's "Demo login"
button, then create a matching Django user with the same credentials.

## API overview

**Projects** (`/api/projects/`) — CRUD for `projects` and `phases`.

**Timesheets** (`/api/timesheets/`)
- `GET/POST /entries/`, `GET/PUT/DELETE /entries/{id}/`
- `POST /entries/{id}/submit/`, `/approve/`, `/reject/`, `/resubmit/`
- `GET /entries/pending_approvals/`
- `POST /entries/{id}/mark_sync_result/` — records the outcome of an external Odoo sync attempt

**Billing** (`/api/billing/`)
- `GET/POST /proposals/`, `POST /proposals/calculate/`, `POST /proposals/{id}/submit/`
- `GET/POST /invoices/`, `GET/PUT/DELETE /invoices/{id}/`
- `POST /invoices/{id}/issue/`, `/void/`, `/record_payment/`
- `POST /invoices/{id}/sync-to-odoo/`, `/refresh-payment-status/` — enqueue Odoo sync jobs
- `GET /sync-jobs/`, `POST /sync-jobs/{id}/claim/`, `/complete/`, `/fail/`

**Auth** — `POST /api/auth/token/` (DRF token auth). Internal services authenticate with the
`X-Service-Token` header instead, using the shared `PRIMEPROJECTS_SERVICE_TOKEN`.

**Integration service** (Node.js, port 8090)
- `POST /odoo/authenticate`
- `POST /odoo/timesheets/sync` — idempotent upsert of a timesheet into `account.analytic.line`
- `POST /odoo/invoices/sync` — idempotent upsert of a draft `account.move`
- `POST /odoo/invoices/payment-status` — reads Odoo payment state
- `POST /odoo/search-read` — generic passthrough for ad-hoc Odoo reads

## Running tests

```bash
docker compose exec backend python manage.py test apps.timesheets apps.billing
```

## Architecture notes

- The invoice sync queue (`InvoiceSyncJob`) uses transactional row-level locking on claim,
  exponential backoff on retry, and a terminal `FAILED` state after `max_attempts`.
- Timesheet approvals are tracked in an immutable `TimesheetApproval` history table; state
  transitions are: `DRAFT/REJECTED -> SUBMITTED -> APPROVED` or `SUBMITTED -> REJECTED`.
- Invoices are only editable while `DRAFT`; totals are recalculated centrally whenever lines
  change, never left to drift.
- The Odoo custom module (`odoo/addons/primeprojects`) extends `hr.employee`,
  `project.project`, `project.task`, `account.analytic.line`, and `account.move` with
  `primeprojects_external_id`-style mapping fields, plus a `primeprojects.sync.log` model.

## Known limitations (not yet implemented)

These were explicitly flagged as future work across the original increments and have not
been built yet:
- No `Employee`/`CustomerAccount` foreign-key models — timesheets/invoices still store plain
  name fields rather than real master-data references.
- No automated timesheet sync worker (invoice sync has one; timesheets are sync-able via the
  integration service's `/odoo/timesheets/sync` endpoint, but nothing polls for pending ones
  automatically yet).
- No full Odoo↔PrimeProjects reconciliation report.
- No weekly timesheet grid, manager approval inbox, or invoice detail/preview screens in the
  frontend — it currently covers Projects, Create Invoice, and Invoice listing only.
