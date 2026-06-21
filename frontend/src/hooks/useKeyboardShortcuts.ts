import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

/** Registers global keyboard shortcuts (C, /, ?, G-then-B/L, Cmd+K). */
export function useKeyboardShortcuts(): void {
  const navigate = useNavigate();
  const { projectKey } = useParams();
  const { openCreateIssue, setCommandPalette, setShortcuts } = useUiStore();
  const lastG = useRef<number>(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Command palette works even while typing.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPalette(true);
        return;
      }
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const sinceG = Date.now() - lastG.current;

      if (key === 'g') {
        lastG.current = Date.now();
        return;
      }
      if (sinceG < 800 && projectKey) {
        if (key === 'b') {
          navigate(`/projects/${projectKey}/board`);
          return;
        }
        if (key === 'l') {
          navigate(`/projects/${projectKey}/backlog`);
          return;
        }
      }

      if (key === 'c') {
        e.preventDefault();
        openCreateIssue();
      } else if (e.key === '/') {
        e.preventDefault();
        setCommandPalette(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcuts(true);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, projectKey, openCreateIssue, setCommandPalette, setShortcuts]);
}
