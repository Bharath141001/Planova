import { describe, it, expect } from 'vitest';
import { formatDate, formatHours, formatFileSize, initials, colorFromString, truncate } from './formatters';

describe('formatDate', () => {
  it('returns em-dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats a valid date string', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
  });

  it('returns em-dash for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatHours', () => {
  it('returns 0h for null/undefined', () => {
    expect(formatHours(null)).toBe('0h');
    expect(formatHours(undefined)).toBe('0h');
  });

  it('converts sub-hour values to minutes', () => {
    expect(formatHours(0.5)).toBe('30m');
  });

  it('renders whole hours without decimal', () => {
    expect(formatHours(8)).toBe('8h');
  });

  it('renders fractional hours with one decimal', () => {
    expect(formatHours(1.5)).toBe('1.5h');
  });
});

describe('formatFileSize', () => {
  it('renders bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('renders kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('renders megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('initials', () => {
  it('returns up to 2 uppercase initials', () => {
    expect(initials('John Doe')).toBe('JD');
    expect(initials('Alice')).toBe('A');
    expect(initials('Alice Bob Charlie')).toBe('AB');
  });

  it('handles empty string', () => {
    expect(initials('')).toBe('');
  });
});

describe('colorFromString', () => {
  it('returns a hex color', () => {
    const color = colorFromString('hello');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('is deterministic for the same input', () => {
    expect(colorFromString('test')).toBe(colorFromString('test'));
  });

  it('returns different colors for different inputs (most of the time)', () => {
    const colors = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(colorFromString));
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe('truncate', () => {
  it('leaves short strings untouched', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long strings with ellipsis', () => {
    const result = truncate('a'.repeat(70), 60);
    expect(result.length).toBe(61); // 60 chars + '…'
    expect(result.endsWith('…')).toBe(true);
  });
});
