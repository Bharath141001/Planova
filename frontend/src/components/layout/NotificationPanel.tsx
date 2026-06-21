import { Link } from 'react-router-dom';
import { Check, CheckCheck, Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useNotificationActions } from '@/hooks/useNotifications';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { timeAgo } from '@/utils/formatters';
import { cx } from '@/utils/cx';
import styles from './NotificationPanel.module.scss';

export function NotificationPanel() {
  const { notifications, panelOpen, setPanelOpen } = useNotificationStore();
  const { markRead, markAllRead } = useNotificationActions();

  if (!panelOpen) return null;

  const NotifItem = ({ n }: { n: (typeof notifications)[0] }) => (
    <div className={cx(styles.notifItem, !n.isRead && styles.unread)}>
      <Avatar user={n.actor} size="sm" />
      <div className={styles.notifBody}>
        <p className={styles.notifText}>
          {n.actor && <span className={styles.notifSender}>{n.actor.displayName} </span>}
          {n.message}
        </p>
        <p className={styles.notifTime}>{timeAgo(n.createdAt)}</p>
      </div>
      {!n.isRead && (
        <button
          onClick={(e) => { e.preventDefault(); void markRead(n.id); }}
          aria-label="Mark as read"
          className={styles.markReadBtn}
        >
          <Check size={16} />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className={styles.overlay} onClick={() => setPanelOpen(false)} aria-hidden />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Notifications</h3>
          <button onClick={markAllRead} className={styles.markAllBtn}>
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
        <div className={styles.list}>
          {notifications.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState icon={Bell} title="You're all caught up" description="No notifications yet." />
            </div>
          ) : (
            notifications.map((n) =>
              n.issue ? (
                <Link
                  key={n.id}
                  to={`/issues/${n.issue.key}`}
                  style={{ textDecoration: 'none' }}
                  onClick={() => { setPanelOpen(false); if (!n.isRead) void markRead(n.id); }}
                >
                  <NotifItem n={n} />
                </Link>
              ) : (
                <NotifItem key={n.id} n={n} />
              )
            )
          )}
        </div>
      </div>
    </>
  );
}
