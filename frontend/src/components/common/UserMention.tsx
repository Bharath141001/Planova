import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar } from './Avatar';
import { Input } from '@/components/ui/Input';
import type { UserMini } from '@/types/user.types';
import styles from './UserMention.module.scss';

interface UserMentionProps {
  onSelect: (user: UserMini) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function UserMention({ onSelect, placeholder = 'Search people…', autoFocus }: UserMentionProps) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const { data: users = [], isFetching } = useQuery({
    queryKey: ['user-search', debounced],
    queryFn: () => userService.search(debounced),
  });

  return (
    <div className={styles.root}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <div className={styles.list}>
        {isFetching && <p className={styles.empty}>Searching…</p>}
        {!isFetching && users.length === 0 && (
          <p className={styles.empty}>No people found.</p>
        )}
        {users.map((u) => (
          <button key={u.id} className={styles.userBtn} onClick={() => onSelect(u)}>
            <Avatar user={u} size="sm" />
            <span>{u.displayName}</span>
            {u.username && <span className={styles.username}>@{u.username}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
