import { buildMeta } from '../src/utils/pagination';

describe('buildMeta', () => {
  it('calculates totalPages correctly', () => {
    expect(buildMeta(1, 25, 100).totalPages).toBe(4);
    expect(buildMeta(1, 25, 50).totalPages).toBe(2);
    expect(buildMeta(1, 25, 1).totalPages).toBe(1);
  });

  it('returns at least 1 totalPage even when total is 0', () => {
    expect(buildMeta(1, 25, 0).totalPages).toBe(1);
  });

  it('echoes back page and pageSize', () => {
    const meta = buildMeta(3, 10, 55);
    expect(meta.page).toBe(3);
    expect(meta.pageSize).toBe(10);
    expect(meta.total).toBe(55);
    expect(meta.totalPages).toBe(6);
  });
});
