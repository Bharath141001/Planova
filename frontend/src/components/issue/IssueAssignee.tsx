import { useProjectMembers } from '@/hooks/useProject';
import { useProjectStore } from '@/store/projectStore';
import { Avatar } from '@/components/common/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import type { UserMini } from '@/types/user.types';
import styles from './IssueAssignee.module.scss';

interface IssueAssigneeProps {
  assignee?: UserMini | null;
  onChange: (userId: string | null) => void;
  disabled?: boolean;
  showName?: boolean;
  /** Explicit project key — avoids relying solely on the global store (e.g. when
   *  the panel is opened from a standalone issue URL with no project in context). */
  projectKey?: string;
}

export function IssueAssignee({ assignee, onChange, disabled, showName, projectKey: propKey }: IssueAssigneeProps) {
  const storeKey = useProjectStore((s) => s.currentProject?.key);
  const projectKey = propKey ?? storeKey;
  const { data: members = [] } = useProjectMembers(projectKey);

  if (disabled) {
    return (
      <div className={styles.display}>
        <Avatar user={assignee} size="sm" />
        {showName && <span className={styles.name}>{assignee?.displayName ?? 'Unassigned'}</span>}
      </div>
    );
  }

  return (
    <Dropdown
      trigger={
        <button className={styles.triggerBtn} aria-label="Change assignee">
          <Avatar user={assignee} size="sm" />
          {showName && <span className={styles.name}>{assignee?.displayName ?? 'Unassigned'}</span>}
        </button>
      }
    >
      {(close) => (
        <div className={styles.memberList}>
          <DropdownItem onClick={() => { onChange(null); close(); }}>
            <Avatar user={null} size="sm" /> Unassigned
          </DropdownItem>
          {members.map((m) => (
            <DropdownItem key={m.userId} onClick={() => { onChange(m.userId); close(); }}>
              <Avatar user={m.user} size="sm" /> {m.user.displayName}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
