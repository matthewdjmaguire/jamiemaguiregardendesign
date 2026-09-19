// Formats a reviewer's notes into one message they can paste back to the developer.
// Plain JS (no DOM) so Node can test it directly.

// Sort key for labels: page content ("4") first, then header ("H2"), then footer ("F1").
export function labelOrder(label) {
  const m = /^([HF]?)(\d+)$/.exec(label);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const group = m[1] === 'H' ? 1 : m[1] === 'F' ? 2 : 0;
  return group * 100000 + Number(m[2]);
}

/**
 * @param {{ page: string, label: string, type: string, snippet: string, note: string }[]} entries
 * @param {{ title: string, url: string, date: string, pageOrder: string[] }} meta
 * @returns {string} the message, or '' when there are no notes
 */
export function formatNotes(entries, { title, url, date, pageOrder }) {
  const notes = entries.filter((e) => e.note && e.note.trim());
  if (!notes.length) return '';

  // Pages in site order first, any unknown pages after.
  const pages = [...new Set(notes.map((e) => e.page))].sort((a, b) => {
    const ia = pageOrder.indexOf(a);
    const ib = pageOrder.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const lines = [`Review notes: ${title}`, `${url} · ${date}`, ''];
  for (const page of pages) {
    lines.push(`## ${page}`);
    const pageNotes = notes.filter((e) => e.page === page).sort((a, b) => labelOrder(a.label) - labelOrder(b.label));
    for (const e of pageNotes) {
      lines.push(`(${e.label}) ${e.type}: “${e.snippet}”`);
      lines.push(`    → ${e.note.trim().replace(/\n+/g, ' ')}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}
