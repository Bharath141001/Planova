import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectService } from '@/services/projectService';
import { useProjectMembers } from '@/hooks/useProject';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import type { ProjectRole } from '@/types/common.types';
import type { ProjectMember } from '@/types/project.types';
import styles from './MemberManagement.module.scss';

const ROLES: ProjectRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

export function MemberManagement({ projectKey }: { projectKey: string }) {
  const qc = useQueryClient();
  const { data: members = [] } = useProjectMembers(projectKey);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('MEMBER');
  const [toRemove, setToRemove] = useState<ProjectMember | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.members(projectKey) });

  const add = useMutation({
    mutationFn: () => projectService.addMember(projectKey, email, role),
    onSuccess: () => { invalidate(); setEmail(''); toast.success('Member added'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: ProjectRole }) =>
      projectService.updateMember(projectKey, userId, newRole),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => projectService.removeMember(projectKey, userId),
    onSuccess: () => { invalidate(); setToRemove(null); toast.success('Member removed'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className={styles.root}>
      <div className={styles.inviteSection}>
        <label className={styles.inviteLabel}>Invite by email</label>
        <div className={styles.inviteRow}>
          <Input
            className={styles.inviteInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            onKeyDown={(e) => e.key === 'Enter' && email && add.mutate()}
          />
          <Select className={styles.inviteRole} value={role} onChange={(e) => setRole(e.target.value as ProjectRole)}>
            {ROLES.filter((r) => r !== 'OWNER').map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Button onClick={() => add.mutate()} loading={add.isPending} disabled={!email}>
            <UserPlus size={16} /> Add
          </Button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className={styles.memberCell}>
                    <Avatar user={m.user} size="sm" />
                    <div>
                      <p className={styles.memberName}>{m.user.displayName}</p>
                      <p className={styles.memberEmail}>{m.user.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Select value={m.role} onChange={(e) => updateRole.mutate({ userId: m.userId, newRole: e.target.value as ProjectRole })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </td>
                <td>
                  <button onClick={() => setToRemove(m)} className={styles.removeBtn} aria-label="Remove member">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove member?"
        message={`Remove ${toRemove?.user.displayName} from this project?`}
        destructive
        confirmLabel="Remove"
        loading={remove.isPending}
        onCancel={() => setToRemove(null)}
        onConfirm={() => toRemove && remove.mutate(toRemove.userId)}
      />
    </div>
  );
}
