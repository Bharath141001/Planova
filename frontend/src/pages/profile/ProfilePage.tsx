import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { getErrorMessage } from '@/services/api';
import styles from './ProfilePage.module.scss';

const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');

  const save = useMutation({
    mutationFn: () => userService.updateProfile({ displayName, timezone }),
    onSuccess: (u) => { setUser(u); toast.success('Profile updated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (u) => { setUser(u); toast.success('Avatar updated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className={styles.page}>
      <PageHeader title="Your profile" breadcrumbs={[{ label: 'Profile' }]} />
      <div className={styles.card}>
        <div className={styles.avatarRow}>
          <Avatar user={user} size="lg" />
          <div>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} loading={uploadAvatar.isPending}>
              Change avatar
            </Button>
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])} />
            <p className={styles.avatarHint}>JPG or PNG, up to 10MB.</p>
          </div>
        </div>
        <div className={styles.field}>
          <Label>Display name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className={styles.field}>
          <Label>Email</Label>
          <Input value={user?.email ?? ''} disabled />
        </div>
        <div className={styles.field}>
          <Label>Timezone</Label>
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </Select>
        </div>
        <Button onClick={() => save.mutate()} loading={save.isPending}>Save changes</Button>
      </div>
    </div>
  );
}
