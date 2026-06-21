import { rankBetween, initialRank } from '../src/utils/issueKeyGenerator';

describe('rankBetween (LexoRank-lite)', () => {
  it('produces a rank between two adjacent ranks', () => {
    const a = initialRank(0);
    const b = initialRank(1);
    const mid = rankBetween(a, b);
    expect(mid > a).toBe(true);
    expect(mid < b).toBe(true);
  });

  it('handles open-ended bounds (start and end of list)', () => {
    const first = rankBetween(null, 'm');
    expect(first < 'm').toBe(true);
    const last = rankBetween('m', null);
    expect(last > 'm').toBe(true);
  });

  it('keeps ordering stable across repeated insertions at the front', () => {
    let lowest = initialRank(5);
    for (let i = 0; i < 20; i++) {
      const next = rankBetween(null, lowest);
      expect(next < lowest).toBe(true);
      lowest = next;
    }
  });

  it('generates monotonically increasing initial ranks', () => {
    expect(initialRank(0) < initialRank(1)).toBe(true);
    expect(initialRank(10) < initialRank(11)).toBe(true);
  });
});
