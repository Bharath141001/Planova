import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, type Permission } from '@/utils/permissions';

/** Returns true if the current user may perform `permission` in the active project. */
export function usePermission(permission: Permission): boolean {
  const role = useProjectStore((s) => s.currentRole);
  const globalRole = useAuthStore((s) => s.user?.role);
  // Global admins act as project OWNER everywhere.
  if (globalRole === 'ADMIN') return true;
  return hasPermission(role, permission);
}
