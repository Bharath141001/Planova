import { describe, it, expect } from 'vitest';
import { hasPermission, PERMISSION_MATRIX } from './permissions';

describe('hasPermission', () => {
  it('returns false for null/undefined role', () => {
    expect(hasPermission(null, 'issue:create')).toBe(false);
    expect(hasPermission(undefined, 'issue:create')).toBe(false);
  });

  it('VIEWER can only comment and view reports', () => {
    expect(hasPermission('VIEWER', 'comment:create')).toBe(true);
    expect(hasPermission('VIEWER', 'report:view')).toBe(true);
    expect(hasPermission('VIEWER', 'issue:create')).toBe(false);
    expect(hasPermission('VIEWER', 'issue:edit')).toBe(false);
    expect(hasPermission('VIEWER', 'project:delete')).toBe(false);
  });

  it('MEMBER can manage issues but not configure the project', () => {
    expect(hasPermission('MEMBER', 'issue:create')).toBe(true);
    expect(hasPermission('MEMBER', 'issue:edit')).toBe(true);
    expect(hasPermission('MEMBER', 'issue:move')).toBe(true);
    expect(hasPermission('MEMBER', 'sprint:start')).toBe(true);
    expect(hasPermission('MEMBER', 'project:configure')).toBe(false);
    expect(hasPermission('MEMBER', 'issue:delete')).toBe(false);
  });

  it('ADMIN has all MEMBER permissions plus project management', () => {
    PERMISSION_MATRIX.MEMBER.forEach((p) => {
      expect(hasPermission('ADMIN', p)).toBe(true);
    });
    expect(hasPermission('ADMIN', 'project:configure')).toBe(true);
    expect(hasPermission('ADMIN', 'sprint:create')).toBe(true);
    expect(hasPermission('ADMIN', 'epic:manage')).toBe(true);
    expect(hasPermission('ADMIN', 'project:delete')).toBe(false);
  });

  it('OWNER has every permission ADMIN has plus project:delete', () => {
    PERMISSION_MATRIX.ADMIN.forEach((p) => {
      expect(hasPermission('OWNER', p)).toBe(true);
    });
    expect(hasPermission('OWNER', 'project:delete')).toBe(true);
  });
});
