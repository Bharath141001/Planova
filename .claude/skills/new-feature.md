---
description: Scaffold a full-stack Planova feature — backend service/controller/route + frontend hook/component
---

Scaffold a complete full-stack feature for Planova. The user will name the feature (e.g. "time-tracking", "custom-fields") and describe what it does.

## Backend scaffold (in order)

### 1. Service — `backend/src/services/<feature>Service.ts`
```ts
import { prisma } from '../config/database';

export const <feature>Service = {
  // business logic methods
};
```

### 2. Controller — `backend/src/controllers/<feature>Controller.ts`
```ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { <feature>Service } from '../services/<feature>Service';
import { sendSuccess, AppError } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';  // NOT used here — applied in routes

const createSchema = z.object({ /* fields */ });

export const <feature>Controller = {
  list: async (req: Request, res: Response) => { ... },
  get:  async (req: Request, res: Response) => { ... },
  create: async (req: Request, res: Response) => { ... },
  update: async (req: Request, res: Response) => { ... },
  remove: async (req: Request, res: Response) => { ... },
};
```
- Use `sendSuccess(res, data)` for success responses
- Throw `new AppError('message', httpStatus)` for domain errors
- Validate request bodies with Zod schemas at the top of the file
- Each method must be `async (req, res) => { ... }` (no explicit `next` unless needed)

### 3. Routes — `backend/src/routes/<feature>Routes.ts`
```ts
import { Router } from 'express';
import { <feature>Controller } from '../controllers/<feature>Controller';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission, requireProjectMember } from '../middleware/permissionMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/',    requireProjectMember(), asyncHandler(<feature>Controller.list));
router.post('/',   requirePermission('<feature>:create'), asyncHandler(<feature>Controller.create));
router.get('/:id', requireProjectMember(), asyncHandler(<feature>Controller.get));
router.put('/:id', requirePermission('<feature>:edit'), asyncHandler(<feature>Controller.update));
router.delete('/:id', requirePermission('<feature>:delete'), asyncHandler(<feature>Controller.remove));

export default router;
```
- Always wrap controller methods with `asyncHandler`
- Mount in `backend/src/app.ts` — remind the user to add the route there

## Frontend scaffold

### 4. API hook — `frontend/src/hooks/use<Feature>.ts`
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';  // axios instance

export function use<Feature>List(projectKey: string) {
  return useQuery({
    queryKey: ['<feature>', projectKey],
    queryFn: () => api.get(`/projects/${projectKey}/<feature>`).then(r => r.data.data),
  });
}

export function useCreate<Feature>(projectKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Create<Feature>Input) =>
      api.post(`/projects/${projectKey}/<feature>`, body).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['<feature>', projectKey] }),
  });
}
```

### 5. Component — `frontend/src/components/<domain>/<FeatureName>.tsx` + `.module.scss`
Follow the same rules as `/new-component` (named export, SCSS module, no default export).

## Reminders for the user
- Add the new route to `backend/src/app.ts`
- Add any new Prisma models to `backend/prisma/schema.prisma` and run a migration
- Export the new component from its folder if a barrel file exists
- Add permissions to `backend/src/utils/permissions.ts` and `frontend/src/utils/permissions.ts`
