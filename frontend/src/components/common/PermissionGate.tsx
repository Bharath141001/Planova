import { usePermission } from '@/hooks/usePermission';
import type { Permission } from '@/utils/permissions';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Renders children only when the current user holds `permission` in the active project. */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const allowed = usePermission(permission);
  return <>{allowed ? children : fallback}</>;
}
