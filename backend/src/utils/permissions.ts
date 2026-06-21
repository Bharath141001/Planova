import { ProjectRole } from '@prisma/client';

/**
 * Canonical permission strings used across the app. The same set is mirrored
 * on the frontend (utils/permissions.ts) so PermissionGate / usePermission and
 * the backend permissionMiddleware agree.
 */
export type Permission =
  | 'project:edit'
  | 'project:delete'
  | 'project:archive'
  | 'project:manage_members'
  | 'project:configure'
  | 'issue:create'
  | 'issue:edit'
  | 'issue:delete'
  | 'issue:assign'
  | 'issue:move'
  | 'issue:transition'
  | 'comment:create'
  | 'comment:edit_own'
  | 'attachment:upload'
  | 'worklog:add'
  | 'sprint:create'
  | 'sprint:edit'
  | 'sprint:delete'
  | 'sprint:start'
  | 'sprint:complete'
  | 'epic:manage'
  | 'report:view';

const VIEWER: Permission[] = ['comment:create', 'report:view'];

const MEMBER: Permission[] = [
  ...VIEWER,
  'issue:create',
  'issue:edit',
  'issue:assign',
  'issue:move',
  'issue:transition',
  'comment:edit_own',
  'attachment:upload',
  'worklog:add',
  'sprint:start',
  'sprint:complete',
];

const ADMIN: Permission[] = [
  ...MEMBER,
  'issue:delete',
  'project:edit',
  'project:archive',
  'project:manage_members',
  'project:configure',
  'sprint:create',
  'sprint:edit',
  'sprint:delete',
  'epic:manage',
];

const OWNER: Permission[] = [...ADMIN, 'project:delete'];

export const PERMISSION_MATRIX: Record<ProjectRole, Permission[]> = {
  VIEWER,
  MEMBER,
  ADMIN,
  OWNER,
};

export function roleHasPermission(role: ProjectRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role].includes(permission);
}
