import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { IssueDetail } from './IssueDetail';
import styles from './IssuePanel.module.scss';

interface IssuePanelProps {
  issueKey: string | null;
  onClose: () => void;
}

/** Slide-in right-side panel that hosts the full IssueDetail. */
export function IssuePanel({ issueKey, onClose }: IssuePanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (issueKey) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [issueKey, onClose]);

  if (!issueKey) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.panel}>
        <IssueDetail issueKey={issueKey} onClose={onClose} showFullPageLink />
      </div>
    </div>,
    document.body
  );
}
