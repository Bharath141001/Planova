import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Search, Sun, Moon, LogOut, User as UserIcon, Keyboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar } from '@/components/common/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { NotificationPanel } from './NotificationPanel';
import { CommandPalette } from './CommandPalette';
import styles from './TopNav.module.scss';

export function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, openCreateIssue, setCommandPalette, setShortcuts } = useUiStore();
  const { unreadCount, panelOpen, setPanelOpen } = useNotificationStore();
  useNotifications();

  return (
    <header className={styles.header}>
      <button onClick={() => setCommandPalette(true)} className={styles.searchBtn}>
        <Search size={16} aria-hidden="true" />
        <span>Search issues, projects…</span>
        <kbd className={styles.searchKbd}>⌘K</kbd>
      </button>

      <div className={styles.actions}>
        <button onClick={() => openCreateIssue()} className={styles.createBtn} aria-label="Create issue">
          <Plus size={16} aria-hidden="true" /> Create
        </button>

        <button onClick={() => setShortcuts(true)} aria-label="Keyboard shortcuts" className={styles.iconBtn}>
          <Keyboard size={20} aria-hidden="true" />
        </button>

        <button onClick={toggleTheme} aria-label="Toggle theme" className={styles.iconBtn}>
          {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
        </button>

        <div className={styles.notifWrapper}>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            aria-label={`Notifications (${unreadCount} unread)`}
            className={styles.iconBtn}
          >
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          <NotificationPanel />
        </div>

        <Dropdown
          align="right"
          trigger={
            <button className={styles.avatarBtn} aria-label="Account menu">
              <Avatar user={user} size="md" />
            </button>
          }
        >
          {(close) => (
            <>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{user?.displayName}</p>
                <p className={styles.userEmail}>{user?.email}</p>
              </div>
              <DropdownItem onClick={() => { close(); navigate('/profile'); }}>
                <UserIcon size={16} /> Profile
              </DropdownItem>
              <DropdownItem onClick={() => void logout()} style={{ color: 'var(--color-danger)' }}>
                <LogOut size={16} /> Log out
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>

      <CommandPalette />
    </header>
  );
}
