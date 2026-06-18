// Report rendering (JSON + Markdown).

export function toJSON(report) {
  return JSON.stringify(report, null, 2);
}

export function toMarkdown(report) {
  const lines = [];
  lines.push(`# ${report.title || 'DiffE2E Report'}`);
  if (report.summary) lines.push('', report.summary);
  for (const sec of report.sections || []) {
    lines.push('', `## ${sec.heading}`);
    if (sec.text) lines.push('', sec.text);
    if (sec.table) lines.push('', renderTable(sec.table));
  }
  return lines.join('\n') + '\n';
}

function renderTable({ headers, rows }) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return [head, sep, body].join('\n');
}
