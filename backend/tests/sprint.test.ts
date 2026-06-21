/**
 * Unit tests for sprint-related pure logic: velocity computation and the
 * "done status" heuristic used across the board, backlog, and reports.
 */

function isDoneStatus(status: string): boolean {
  return /done|complete|closed|resolved/i.test(status);
}

function computeVelocity(issues: { status: string; storyPoints: number | null }[]): number {
  return issues
    .filter((i) => isDoneStatus(i.status))
    .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
}

describe('sprint velocity', () => {
  const issues = [
    { status: 'Done', storyPoints: 5 },
    { status: 'In Progress', storyPoints: 3 },
    { status: 'Resolved', storyPoints: 2 },
    { status: 'To Do', storyPoints: 8 },
    { status: 'Done', storyPoints: null },
  ];

  it('sums story points of completed issues only', () => {
    expect(computeVelocity(issues)).toBe(7); // 5 + 2, null counts as 0
  });

  it('returns 0 when nothing is complete', () => {
    expect(computeVelocity([{ status: 'To Do', storyPoints: 5 }])).toBe(0);
  });
});

describe('isDoneStatus', () => {
  it.each(['Done', 'done', 'Completed', 'CLOSED', 'Resolved'])('treats "%s" as done', (s) => {
    expect(isDoneStatus(s)).toBe(true);
  });

  it.each(['To Do', 'In Progress', 'In Review', 'Backlog'])('treats "%s" as not done', (s) => {
    expect(isDoneStatus(s)).toBe(false);
  });
});
