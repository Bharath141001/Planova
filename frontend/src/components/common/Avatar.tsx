import { cx } from '@/utils/cx';
import { initials, colorFromString } from '@/utils/formatters';
import type { UserMini } from '@/types/user.types';
import styles from './Avatar.module.scss';

interface AvatarProps {
  user?: UserMini | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  const name = user?.displayName ?? 'Unassigned';
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        title={name}
        className={cx(styles.image, styles[size], className)}
      />
    );
  }
  return (
    <span
      title={name}
      aria-label={name}
      className={cx(styles.fallback, styles[size], className)}
      style={{ backgroundColor: user ? colorFromString(name) : '#94A3B8' }}
    >
      {user ? initials(name) : '?'}
    </span>
  );
}

export function AvatarGroup({
  users,
  max = 4,
  size = 'sm',
}: {
  users: UserMini[];
  max?: number;
  size?: AvatarProps['size'];
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className={styles.group}>
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} />
      ))}
      {extra > 0 && <span className={styles.extraCount}>+{extra}</span>}
    </div>
  );
}
