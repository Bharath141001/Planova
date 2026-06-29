# Planova — Project Management & Sprint Planning

A full-stack, Jira-like application: Kanban boards, Scrum backlogs, sprint
planning, roadmaps, reports, real-time collaboration, and role-based
permissions.

**Stack:** React 18 + TypeScript + Vite + Zustand + TanStack Query + Tailwind ·
Node + Express + TypeScript + Prisma + PostgreSQL + Redis + Socket.IO.

---

## Features

- **Auth** — register/login, JWT access tokens with rotating refresh tokens
  (httpOnly cookie), forgot-password via email OTP, profile + avatar upload.
- **Projects** — Scrum/Kanban templates, members & roles, public/private,
  archive/delete, configurable columns, labels, and custom fields.
- **Issues** — 6 types, rich-text descriptions (TipTap), subtasks, links,
  watchers, attachments (S3 or local fallback), comments with reactions &
  threading, full activity log, time tracking, bulk edit, clone.
- **Board** — drag-and-drop with optimistic updates, WIP limits, swimlanes
  (assignee/epic), filters, collapsible columns, priority-colored cards.
- **Backlog** — sprint sections + backlog, drag between them, capacity (points),
  inline create, bulk move, start/complete sprint flows.
- **Sprints** — create/start/complete with velocity auto-calculation and
  carry-over of incomplete issues.
- **Roadmap** — Gantt-style epic timeline with month/quarter/year zoom and live
  progress overlays.
- **Reports** — Burndown, Velocity, Sprint Report, Cumulative Flow, Epic
  Report, Team Workload (Recharts).
- **Real-time** — Socket.IO pushes issue/sprint/comment changes and live
  notifications; in-app bell + email digests.
- **UX** — command palette (⌘K), keyboard shortcuts, dark mode, toasts,
  skeletons, empty states, right-side issue panel, error boundaries.

---

## Quick start (Docker)

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, the API (migrates + seeds automatically), and the
web app.

- Web: http://localhost:5173
- API: http://localhost:4000

> **Note:** the backend uses `prisma migrate deploy`, which requires a committed
> migration. On a fresh checkout run `npm run prisma:migrate` once in `backend/`
> to generate the initial migration (or change the compose command to
> `prisma db push`).

---

## Local development

### Prerequisites
- Node 20+ and npm
- PostgreSQL 14+ and Redis (or `docker compose up postgres redis`)

### Backend

```bash
cd backend
cp .env.example .env          # adjust DATABASE_URL / REDIS_URL if needed
npm install
npm run prisma:generate
npm run prisma:migrate         # creates the schema + initial migration
npm run seed                   # 5 users, 2 projects, 3 sprints/project, 50+ issues
npm run dev                    # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                    # http://localhost:5173 (proxies /api to :4000)
```

### Seed accounts

All seeded users share the password **`Password123!`**:

| Email           | Role               |
| --------------- | ------------------ |
| admin@acme.dev  | Global admin / Owner |
| sara@acme.dev   | Project admin      |
| mike@acme.dev   | Member             |
| lena@acme.dev   | Member             |
| tom@acme.dev    | Viewer             |

---

## Environment variables

**backend/.env**

| Var | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection (optional — app degrades gracefully) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets |
| `AWS_*` | S3 attachment storage (falls back to local `/uploads` if unset) |
| `SMTP_*` | Email (logs to console if unset) |
| `CLIENT_URL` | Allowed CORS origin |
| `PORT` | API port (default 4000) |

**frontend/.env**

| Var | Description |
| --- | --- |
| `VITE_API_URL` | API base URL (default `http://localhost:4000/api`) |
| `VITE_SOCKET_URL` | Socket.IO URL (default `http://localhost:4000`) |

---

## Architecture notes

- **Permissions** are defined once per side (`utils/permissions.ts`) and kept in
  sync. The frontend `<PermissionGate>` / `usePermission()` hide UI; the backend
  `permissionMiddleware` is the real enforcement point.
- **Issue ordering** uses a lexicographic LexoRank-lite scheme so drag-and-drop
  reordering only writes one row.
- **Issue keys** (`APP-42`) are generated atomically inside the create
  transaction via an incrementing per-project counter.
- **Graceful degradation** — Redis, S3, and SMTP are all optional; the app runs
  fully without them (in-memory pass-through cache, local disk uploads, console
  email).
- **Optimistic UI** — board drag and inline field edits update the TanStack
  Query cache immediately and roll back on error.

---

## Project layout

```
backend/   Express + Prisma API (config, middleware, services, controllers, routes, jobs)
frontend/  React app (components, pages, hooks, store, services, types, utils, router)
docker-compose.yml
```

## Scripts

**backend:** `dev`, `build`, `start`, `seed`, `prisma:migrate`, `prisma:studio`, `test`
**frontend:** `dev`, `build`, `preview`, `typecheck`, `lint`

---

## Claude Code skills

Project-specific slash commands for Claude Code, stored in `.claude/skills/`.

| Skill | Description |
| --- | --- |
| `/new-component` | Scaffold a React component + `.module.scss` pair in `frontend/src/components/`. Creates a named export with `styles.root` wrapper and BEM-lite SCSS scoping — no styled-components. |
| `/new-page` | Scaffold a new page component + `.module.scss` under `frontend/src/pages/`, then walk through registering the route in `AppRouter.tsx` and adding a sidebar link. |
| `/new-feature` | Full-stack scaffold for a new feature: backend service → controller → route file, plus a TanStack Query hook and React component on the frontend. Includes reminders for `app.ts` registration and permissions sync. |
| `/run` | Start the dev environment — local two-server mode (`backend` on :4000, `frontend` on :5173) or the full Docker stack. |
| `/db-migrate` | Prisma migration workflow: edit schema → `migrate dev` → `generate` → re-seed, plus a cheat-sheet of common Prisma commands. |
