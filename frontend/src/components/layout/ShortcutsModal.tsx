import { Modal } from '@/components/ui/Modal';
import { useUiStore } from '@/store/uiStore';
import styles from './ShortcutsModal.module.scss';

const SHORTCUTS = [
  { keys: 'C', description: 'Create issue' },
  { keys: '/', description: 'Focus search' },
  { keys: '⌘ / Ctrl + K', description: 'Open command palette' },
  { keys: 'G then B', description: 'Go to Board' },
  { keys: 'G then L', description: 'Go to Backlog' },
  { keys: '?', description: 'Show this help' },
  { keys: 'Esc', description: 'Close dialogs' },
];

export function ShortcutsModal() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcuts);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts" size="sm">
      <ul className={styles.list}>
        {SHORTCUTS.map((s) => (
          <li key={s.keys} className={styles.item}>
            <span className={styles.desc}>{s.description}</span>
            <kbd className={styles.kbd}>{s.keys}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
