/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { highlight } from './highlight.js';
import { escapeHtml } from './html.js';

// The Data tab of a code slide: the files a snippet reads with `asset('<name>')` (the files of `public/data`), shown as the
// data they are, with the residue keys that join each row to the structure marked.

/** The file names a snippet reads through `asset(...)`, in order of appearance. */
export function assetNames(code: string): string[] {
  const names = new Set<string>();
  for (const m of code.matchAll(/\basset\(\s*(['"])([^'"]+)\1\s*\)/g)) names.add(m[2]);
  return [...names];
}

/** The columns an MVS annotation is joined to the structure by (packages/mvs runtime `FieldsForSchemas`). */
const KeyColumns = new Set([
  'group_id',
  'label_entity_id',
  'label_asym_id',
  'label_seq_id',
  'auth_asym_id',
  'auth_seq_id',
  'pdbx_PDB_ins_code',
  'beg_label_seq_id',
  'end_label_seq_id',
  'beg_auth_seq_id',
  'end_auth_seq_id',
  'label_atom_id',
  'auth_atom_id',
  'atom_id',
]);

/** Values longer than this go on a line of their own, so a row stays readable. */
const ShortValue = 24;

const isRow = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** JSON for reading: a table (an array of flat objects) as one object per few lines, short values together; else indented. */
export function formatJson(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isRow)) return JSON.stringify(value, undefined, 2);
  const rows = value.map((row) => {
    const entries = Object.entries(row).map(([k, v]) => ({ k, text: `${JSON.stringify(k)}: ${JSON.stringify(v)}` }));
    // The keys on the first line, the short values on the next, each long value on a line of its own.
    const keys = entries.filter((e) => KeyColumns.has(e.k));
    const rest = entries.filter((e) => !KeyColumns.has(e.k));
    const short = rest.filter((e) => e.text.length <= ShortValue + 16);
    const long = rest.filter((e) => !short.includes(e));
    const lines = [keys, short].filter((g) => g.length).map((g) => g.map((e) => e.text).join(', '));
    lines.push(...long.map((e) => e.text));
    return lines.map((l, i) => `${i === 0 ? '  { ' : '    '}${l}${i === lines.length - 1 ? ' }' : ','}`).join('\n');
  });
  return `[\n${rows.join(',\n')}\n]`;
}

/** A file's text as HTML for the Data pane: JSON as a readable table with its key columns marked, other formats as text. */
export function dataHtml(name: string, text: string): string {
  if (!/\.json$/i.test(name)) return escapeHtml(text.trim());
  let shown: string;
  try {
    shown = formatJson(JSON.parse(text));
  } catch {
    shown = text.trim();
  }
  return markKeys(highlight(shown, 'json'));
}

/** Marks the key columns of highlighted JSON. */
export function markKeys(html: string): string {
  return html.replace(/<span class="tk-p">"([A-Za-z_]+)"<\/span>/g, (all, key: string) =>
    KeyColumns.has(key) ? `<span class="tk-p tk-key">"${key}"</span>` : all,
  );
}
