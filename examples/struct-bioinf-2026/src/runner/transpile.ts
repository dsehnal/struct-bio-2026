/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

// TypeScript to JavaScript for snippets, with the TypeScript compiler's own `transpileModule` (@typescript/typescript6,
// loaded on first use as a chunk of its own: it is not part of the slides or the editor). Types are erased; syntax errors
// come back with their line. Why this one and not Monaco's worker emit or sucrase: it runs the same in the page and in
// the unit tests (the worker needs a browser and the editor, but the slides run snippets too), reports syntax errors with
// positions, and gives the source map the error lines are mapped through. Sucrase would be much smaller (no dependency
// of this workspace yet): only this file would change.

export interface CodeProblem {
  /** 1-based line in the snippet; 0 when the problem is about the code as a whole. */
  line: number;
  message: string;
}

/**
 * `lines[i]` is the snippet's line (1-based) that line i (0-based) of the JavaScript came from, or 0: erasing types
 * removes lines, so errors are mapped back through the source map.
 */
export type Transpiled = { ok: true; js: string; lines: number[] } | { ok: false; problems: CodeProblem[] };

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Generated line to source line (1-based; 0 when unmapped), from a source map's `mappings`. */
export function sourceLines(mappings: string): number[] {
  const out: number[] = [];
  let sourceLine = 0;
  for (const line of mappings.split(';')) {
    let first = 0;
    for (const segment of line.split(',')) {
      if (!segment) continue;
      const values: number[] = [];
      let value = 0;
      let shift = 0;
      for (const ch of segment) {
        const digit = B64.indexOf(ch);
        value += (digit & 31) << shift;
        if (digit & 32) shift += 5;
        else {
          values.push(value & 1 ? -(value >> 1) : value >> 1);
          value = 0;
          shift = 0;
        }
      }
      if (values.length >= 3) {
        sourceLine += values[2];
        if (!first) first = sourceLine + 1;
      }
    }
    out.push(first);
  }
  return out;
}

type TS = typeof import('@typescript/typescript6');
let compiler: Promise<TS> | undefined;
function typescript(): Promise<TS> {
  compiler ??= import('@typescript/typescript6').then((m) => ((m as { default?: TS }).default ?? m) as TS);
  return compiler;
}

/** Import and export statements: snippets are one scope with the globals the typings declare. */
const MODULE_SYNTAX = /^\s*(import|export)\b/;

export async function transpile(code: string): Promise<Transpiled> {
  const ts = await typescript();
  const r = ts.transpileModule(code, {
    fileName: 'snippet.ts',
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      removeComments: false,
      // Imports are kept (not dropped as unused), so that they can be refused.
      verbatimModuleSyntax: true,
      sourceMap: true,
    },
  });
  const problems = (r.diagnostics ?? []).map((d) => ({
    line: d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0,
    message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
  }));
  if (problems.length) return { ok: false, problems };
  const strict = /^"use strict";\n/.test(r.outputText);
  const js = r.outputText
    .replace(/^"use strict";\n?/, '')
    .replace(/\n?\/\/# sourceMappingURL=.*$/m, '')
    .replace(/\n?export \{\};\s*$/, '\n');
  const map = r.sourceMapText ? (JSON.parse(r.sourceMapText) as { mappings: string }).mappings : '';
  const lines = sourceLines(map).slice(strict ? 1 : 0);
  const modules = js
    .split('\n')
    .flatMap((text, i) => (MODULE_SYNTAX.test(text) ? [{ line: lines[i] || i + 1, text }] : []));
  if (modules.length) {
    return {
      ok: false,
      problems: modules.map((m) => ({
        line: m.line,
        message: 'import and export are not available here: use the globals (builder, molql, ...) directly.',
      })),
    };
  }
  return { ok: true, js, lines };
}
