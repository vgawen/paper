import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Output dir for per-test coverage maps (overridden per run via COV_OUT).
const OUT = process.env.COV_OUT || 'cov/run';

// Extend the built-in `page` fixture to record, for each test, the set of
// application source files it actually executed (file-level, L1 attribution).
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    const entries = await page.coverage.stopJSCoverage();

    const files = new Set<string>();
    // file -> set of executed NAMED functions (functionName != '', any range count > 0).
    // Top-level module code is reported as functionName '' (module eval) and is excluded,
    // so `funcs` captures only genuinely-called named functions (function-level attribution).
    const funcs: Record<string, string[]> = {};
    for (const entry of entries) {
      const url: string = (entry as any).url || '';
      const m = url.match(/\/src\/[^?#]*\.js/);
      if (!m) continue;
      // Count only files with at least one executed range (count > 0).
      const executed = (entry.functions || []).some((fn: any) =>
        (fn.ranges || []).some((r: any) => r.count > 0)
      );
      if (executed) files.add(m[0]);
      const names = new Set<string>();
      for (const fn of (entry.functions || [])) {
        if (!fn.functionName) continue; // skip top-level '' and anonymous handlers
        for (const r of (fn.ranges || [])) {
          if (r.count > 0) { names.add(fn.functionName); break; }
        }
      }
      if (names.size) funcs[m[0]] = [...names];
    }

    fs.mkdirSync(OUT, { recursive: true });
    const id = testInfo.titlePath.join(' > ').replace(/[^\w.-]+/g, '_');
    fs.writeFileSync(
      path.join(OUT, id + '.json'),
      JSON.stringify({ test: testInfo.titlePath.join(' > '), files: [...files].sort(), funcs }, null, 2)
    );
  },
});

export { expect };
