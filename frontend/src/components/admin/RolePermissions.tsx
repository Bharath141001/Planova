import { PERMISSION_MATRIX, type Permission } from '@/utils/permissions';
import { Check, X } from 'lucide-react';
import type { ProjectRole } from '@/types/common.types';
import styles from './RolePermissions.module.scss';

const ROLES: ProjectRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

const ALL_PERMISSIONS: Permission[] = [
  'project:edit', 'project:delete', 'project:manage_members', 'project:configure',
  'issue:create', 'issue:edit', 'issue:delete', 'issue:move',
  'comment:create', 'attachment:upload', 'worklog:add',
  'sprint:create', 'sprint:start', 'sprint:complete',
  'epic:manage', 'report:view',
];

export function RolePermissions() {
  return (
    <div className={styles.root}>
      <p className={styles.hint}>
        Permissions are role-based and enforced on the server. This matrix shows what each project role can do.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Permission</th>
              {ROLES.map((r) => <th key={r}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((perm) => (
              <tr key={perm}>
                <td className={styles.permName}>{perm}</td>
                {ROLES.map((role) => (
                  <td key={role}>
                    {PERMISSION_MATRIX[role].includes(perm)
                      ? <Check size={16} className={styles.yes} style={{ margin: '0 auto' }} />
                      : <X size={16} className={styles.no} style={{ margin: '0 auto' }} />
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
