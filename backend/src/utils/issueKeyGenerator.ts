import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Atomically increments a project's issue counter and returns the next issue
 * key (e.g. "APP-42"). Runs inside the caller's transaction client so the
 * counter and the issue insert commit together — no duplicate keys under
 * concurrent creates.
 */
export async function generateIssueKey(
  tx: Prisma.TransactionClient | PrismaClient,
  projectId: string
): Promise<string> {
  const project = await tx.project.update({
    where: { id: projectId },
    data: { issueCounter: { increment: 1 } },
    select: { key: true, issueCounter: true },
  });
  return `${project.key}-${project.issueCounter}`;
}

/**
 * Lexicographic rank between two existing ranks for drag-and-drop ordering.
 * Uses a simple base-36 midpoint scheme (LexoRank-lite).
 */
const RANK_MIN = '0';
const RANK_MAX = 'z';

export function rankBetween(before: string | null, after: string | null): string {
  const a = before && before.length ? before : RANK_MIN;
  const b = after && after.length ? after : RANK_MAX;
  return midpoint(a, b);
}

function charToVal(c: string): number {
  return parseInt(c, 36);
}
function valToChar(v: number): string {
  return v.toString(36);
}

function midpoint(a: string, b: string): string {
  let i = 0;
  let result = '';
  while (true) {
    const ca = a[i] ?? RANK_MIN;
    const cb = b[i] ?? RANK_MAX;
    if (ca === cb) {
      result += ca;
      i += 1;
      continue;
    }
    const va = charToVal(ca);
    const vb = charToVal(cb);
    if (vb - va > 1) {
      result += valToChar(Math.floor((va + vb) / 2));
      return result;
    }
    // No integer between them: keep the lower char and descend a level.
    result += ca;
    i += 1;
    a = a.slice(i);
    b = '';
    return result + midpoint(a, RANK_MAX);
  }
}

/** Evenly spaced initial ranks for seeding/bulk inserts. */
export function initialRank(index: number): string {
  return (index + 1).toString(36).padStart(6, '0');
}
