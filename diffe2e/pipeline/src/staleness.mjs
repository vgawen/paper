// Classify why a selected test failed on V_new, to route it to the right repair.
export const STRUCTURAL_ONLY = 'STRUCTURAL_ONLY';
export const EXPECTATION_CHANGE = 'EXPECTATION_CHANGE';
export const SUSPECTED_REGRESSION = 'SUSPECTED_REGRESSION';

// Evidence: sigMap (locator changes), segMap (text/expectation changes),
// referencedIds (testIds the failing spec uses).
export function classify({ sigMap = {}, segMap = {}, referencedIds = [] }) {
  const locatorBroke = referencedIds.some((id) => id in sigMap) || Object.keys(sigMap).length > 0;
  if (locatorBroke) return STRUCTURAL_ONLY;
  if (Object.keys(segMap).length > 0) return EXPECTATION_CHANGE;
  return SUSPECTED_REGRESSION;
}
