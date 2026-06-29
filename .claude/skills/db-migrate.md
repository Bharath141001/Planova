---
description: Run Prisma schema changes and migrations for Planova's PostgreSQL database
---

Handle Prisma database migrations for Planova. The schema lives at `backend/prisma/schema.prisma`.

## Workflow for adding/changing models

### 1. Edit the schema
Modify `backend/prisma/schema.prisma` with the new models or fields.

### 2. Create a migration (development)
```powershell
cd backend
npx prisma migrate dev --name <descriptive-name>
```
This generates a SQL migration file in `backend/prisma/migrations/` and applies it to the local DB.

### 3. Regenerate the Prisma client
```powershell
npx prisma generate
```
(Usually runs automatically after `migrate dev`, but run manually after pulling new migrations.)

### 4. Update seed if needed
If the new model needs seed data, update `backend/prisma/seed.ts` and re-run:
```powershell
npm run seed
```

---

## Other common commands

| Task | Command (run from `backend/`) |
|---|---|
| Apply migrations (CI/prod) | `npx prisma migrate deploy` |
| Push schema without migration file | `npx prisma db push` |
| Open Prisma Studio | `npx prisma studio` |
| Reset DB + re-seed | `npx prisma migrate reset` |
| Introspect existing DB | `npx prisma db pull` |

---

## Notes
- Always commit the generated migration SQL files alongside the schema change.
- `prisma migrate reset` wipes ALL data — only use in development.
- The Docker compose backend uses `prisma migrate deploy`, which requires a committed migration; `db push` works for quick local iteration but doesn't generate migration files.
- After changing any model that has relations, check `backend/src/services/` for raw Prisma queries that may need updating.
