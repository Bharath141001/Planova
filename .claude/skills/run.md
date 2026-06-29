---
description: Start Planova dev servers (frontend + backend) or the full Docker stack
---

Start the Planova development environment. Ask the user which mode they want if not specified:

## Mode A — Local dev (two terminals)

**Backend** (runs on http://localhost:4000):
```powershell
cd backend
npm run dev
```
Requires PostgreSQL and Redis running locally or via Docker:
```powershell
docker compose up postgres redis -d
```

**Frontend** (runs on http://localhost:5173, proxies /api → :4000):
```powershell
cd frontend
npm run dev
```

Start both servers in parallel background processes using PowerShell jobs or two terminal panes. After starting, confirm:
- Backend is healthy: `curl http://localhost:4000/api/health` (or equivalent)
- Frontend is reachable at http://localhost:5173

Seed accounts (all use password `Password123!`):
| Email | Role |
|---|---|
| admin@acme.dev | Global admin / Owner |
| sara@acme.dev | Project admin |
| mike@acme.dev | Member |

## Mode B — Full Docker stack

```powershell
docker compose up --build
```
- Web: http://localhost:5173
- API: http://localhost:4000

Note: First run needs a committed Prisma migration. If the DB schema is fresh, run in `backend/` first:
```powershell
npm run prisma:migrate
```

## Mode C — Docker (no rebuild)
```powershell
docker compose up
```

After launching, open the browser at the appropriate URL and verify the login page loads. Report any errors from the startup logs.
