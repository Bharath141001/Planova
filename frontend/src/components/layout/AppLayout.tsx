import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { ShortcutsModal } from './ShortcutsModal';
import { IssueCreateModal } from '@/components/issue/IssueCreateModal';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import styles from './AppLayout.module.scss';

export function AppLayout() {
  useKeyboardShortcuts();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.body}>
        <TopNav />
        <main className={styles.main}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <IssueCreateModal />
      <ShortcutsModal />
    </div>
  );
}
