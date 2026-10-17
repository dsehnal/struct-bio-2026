/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { escapeHtml } from './html.js';

// A small syntax highlighter for what the slides show (TypeScript builder code, Python, JSON, SeqQL): a few regular
// expressions per language, no parsing. Monaco (the playground's editor) is not loaded for the slides.

export type CodeLanguage = 'ts' | 'py' | 'json' | 'seqql';

type Rule = readonly [source: string, className: string];

const Words = (words: string) => `\\b(?:${words.split(' ').join('|')})\\b`;
const Str = `"(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'`;
const Num = `\\b\\d+(?:\\.\\d+)?\\b`;

const Rules: Record<CodeLanguage, readonly Rule[]> = {
  ts: [
    ['//[^\\n]*|/\\*[\\s\\S]*?\\*/', 'tk-c'],
    [`${Str}|\`(?:[^\`\\\\]|\\\\.)*\``, 'tk-s'],
    [
      Words('const let var return await async function import from export new true false null undefined as type'),
      'tk-k',
    ],
    [Num, 'tk-n'],
    ['\\.[A-Za-z_$][\\w$]*(?=\\()', 'tk-m'],
    ['[A-Za-z_$][\\w$]*(?=\\()', 'tk-f'],
  ],
  py: [
    ['#[^\\n]*', 'tk-c'],
    [`"""[\\s\\S]*?"""|${Str}`, 'tk-s'],
    [Words('import from as def return True False None for in with print'), 'tk-k'],
    [Num, 'tk-n'],
    ['\\.[A-Za-z_][\\w]*(?=\\()', 'tk-m'],
    ['[A-Za-z_][\\w]*(?=\\()', 'tk-f'],
  ],
  json: [
    ['"(?:[^"\\\\\\n]|\\\\.)*"(?=\\s*:)', 'tk-p'],
    ['"(?:[^"\\\\\\n]|\\\\.)*"', 'tk-s'],
    [Words('true false null'), 'tk-k'],
    ['-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?', 'tk-n'],
  ],
  seqql: [
    [';[^\\n]*', 'tk-c'],
    [Str, 'tk-s'],
    ['(?<=\\()[A-Za-z][\\w.-]*', 'tk-f'],
    [':[A-Za-z][\\w-]*', 'tk-p'],
    ['\\b\\d+(?:\\.\\d+)?\\b', 'tk-n'],
  ],
};

const Compiled = new Map<CodeLanguage, { re: RegExp; classes: readonly string[] }>();

function compiled(language: CodeLanguage) {
  let c = Compiled.get(language);
  if (!c) {
    const rules = Rules[language];
    c = { re: new RegExp(rules.map(([source]) => `(${source})`).join('|'), 'gy'), classes: rules.map(([, k]) => k) };
    Compiled.set(language, c);
  }
  return c;
}

/** `code` as HTML: escaped, with `<span class="tk-…">` around the tokens (styles in slides.css). */
export function highlight(code: string, language: CodeLanguage): string {
  const { re, classes } = compiled(language);
  let out = '';
  let plain = '';
  const flush = () => {
    out += escapeHtml(plain);
    plain = '';
  };
  let pos = 0;
  while (pos < code.length) {
    re.lastIndex = pos;
    const m = re.exec(code);
    if (!m || m[0].length === 0) {
      plain += code[pos++];
      continue;
    }
    flush();
    let group = 1;
    while (m[group] === undefined) group++;
    out += `<span class="${classes[group - 1]}">${escapeHtml(m[0])}</span>`;
    pos += m[0].length;
  }
  flush();
  return out;
}
