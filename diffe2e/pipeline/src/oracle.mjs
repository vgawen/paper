// Affected-test oracle from V_new full-run coverage (eval only, never fed to selector).
import { selectByCoverage } from './selector.mjs';

export function buildAffected(covVnew, changedFiles) {
  return selectByCoverage(covVnew, changedFiles);
}
