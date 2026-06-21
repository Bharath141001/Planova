import { format, formatDistanceToNow, isValid, differenceInCalendarDays } from 'date-fns';

export function formatDate(date: string | Date | null | undefined, pattern = 'MMM d, yyyy'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return isValid(d) ? format(d, pattern) : '—';
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
}

export function daysRemaining(end: string | Date | null | undefined): number | null {
  if (!end) return null;
  const d = typeof end === 'string' ? new Date(end) : end;
  if (!isValid(d)) return null;
  return differenceInCalendarDays(d, new Date());
}

export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Deterministic color from a string (for avatars without an image). */
export function colorFromString(str: string): string {
  const palette = ['#0052CC', '#6554C0', '#00875A', '#FF991F', '#DE350B', '#00B8D9', '#5243AA'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function truncate(str: string, max = 60): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}
