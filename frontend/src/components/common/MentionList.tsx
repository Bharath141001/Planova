import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { cx } from '@/utils/cx';
import type { UserMini } from '@/types/user.types';
import styles from './MentionList.module.scss';

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: UserMini[];
  command: (attrs: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    const select = (item: UserMini) =>
      command({ id: item.username ?? item.id, label: item.displayName });

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (!items.length) return false;
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          select(items[selectedIndex]);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) return null;

    return (
      <div className={styles.list} role="listbox" aria-label="Mention suggestions">
        {items.map((user, index) => (
          <button
            key={user.id}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            className={cx(styles.item, index === selectedIndex && styles.selected)}
            onMouseDown={(e) => {
              // Prevent editor blur before selection completes
              e.preventDefault();
              select(user);
            }}
          >
            <Avatar user={user} size="sm" />
            <span className={styles.displayName}>{user.displayName}</span>
            {user.username && (
              <span className={styles.username}>@{user.username}</span>
            )}
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';
