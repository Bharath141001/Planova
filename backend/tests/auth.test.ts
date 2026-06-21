import { PERMISSION_MATRIX, roleHasPermission } from '../src/utils/permissions';

describe('permission matrix', () => {
  it('grants OWNER every permission ADMIN has, plus project:delete', () => {
    PERMISSION_MATRIX.ADMIN.forEach((p) => {
      expect(PERMISSION_MATRIX.OWNER).toContain(p);
    });
    expect(roleHasPermission('OWNER', 'project:delete')).toBe(true);
    expect(roleHasPermission('ADMIN', 'project:delete')).toBe(false);
  });

  it('restricts VIEWER to read + comment only', () => {
    expect(roleHasPermission('VIEWER', 'comment:create')).toBe(true);
    expect(roleHasPermission('VIEWER', 'report:view')).toBe(true);
    expect(roleHasPermission('VIEWER', 'issue:create')).toBe(false);
    expect(roleHasPermission('VIEWER', 'issue:edit')).toBe(false);
  });

  it('lets MEMBER manage issues but not configure the project', () => {
    expect(roleHasPermission('MEMBER', 'issue:create')).toBe(true);
    expect(roleHasPermission('MEMBER', 'issue:move')).toBe(true);
    expect(roleHasPermission('MEMBER', 'sprint:start')).toBe(true);
    expect(roleHasPermission('MEMBER', 'project:configure')).toBe(false);
    expect(roleHasPermission('MEMBER', 'issue:delete')).toBe(false);
  });
});
