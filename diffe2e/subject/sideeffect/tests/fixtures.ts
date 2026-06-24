import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Records, per test: (1) executed app source files (CDP coverage, file-level),
// and (2) the shared-state footprint — which backend resources the test READ
// or WROTE, inferred from its /api/* network calls (GET=read, others=write).
// The footprint feeds the state-dependency graph (pipeline/src/statedep.mjs).
const OUT = process.env.COV_OUT || 'cov/run';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    const reads = new Set<string>();
    const writes = new Set<string>();
    page.on('request', (req) => {
      try {
        const url = new URL(req.url());
        if (!url.pathname.startsWith('/api/')) return;
        const resource = `api:${url.pathname}`;
        if (req.method() === 'GET') reads.add(resource);
        else writes.add(resource);
      } catch { /* ignore */ }
    });

    await use(page);

    const entries = await page.coverage.stopJSCoverage();
    const files = new Set<string>();
    for (const entry of entries) {
      const url: string = (entry as any).url || '';
      const m = url.match(/\/src\/[^?#]*\.js/);
      if (!m) continue;
      const executed = (entry.functions || []).some((fn: any) =>
        (fn.ranges || []).some((r: any) => r.count > 0)
      );
      if (executed) files.add(m[0]);
    }

    fs.mkdirSync(OUT, { recursive: true });
    const id = testInfo.titlePath.join(' > ').replace(/[^\w.-]+/g, '_');
    fs.writeFileSync(
      path.join(OUT, id + '.json'),
      JSON.stringify({
        test: testInfo.titlePath.join(' > '),
        files: [...files].sort(),
        reads: [...reads],
        writes: [...writes],
      }, null, 2)
    );
  },
});

export { expect };
