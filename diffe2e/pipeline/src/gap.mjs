// Coverage gap: changed units not touched by the targeted (selected+repaired) tests.
export function coverageGap({ changedUnits, targetedTests, coverageOf }) {
  const covered = new Set();
  for (const t of targetedTests) for (const u of coverageOf(t) || []) covered.add(u);
  return changedUnits.filter((u) => !covered.has(u));
}
