/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import ts from '@typescript/typescript6';
import { describe, expect, it } from 'vitest';
import { MVS_TYPES } from '../generated/mvs-types.js';
import { SAMPLE } from './samples.js';

// The generated typings, checked the way Monaco's worker uses them (editor.ts): strict, ES2020, every file a module, the
// typings as one extra library beside the snippet.

const options: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleDetection: ts.ModuleDetectionKind.Force,
  lib: ['lib.es2020.d.ts'],
  strict: true,
  noEmit: true,
  types: [],
};
const libDir = dirname(ts.getDefaultLibFilePath(options));
const libs = new Map<string, ts.SourceFile>();

function errors(code: string): string[] {
  const files: Record<string, string> = { '/mvs.d.ts': MVS_TYPES, '/snippet.ts': code };
  const host: ts.CompilerHost = {
    getSourceFile: (name, languageVersion) => {
      if (name in files) return ts.createSourceFile(name, files[name], languageVersion);
      const path = join(libDir, name.replace(/^.*\//, ''));
      let file = libs.get(path);
      if (!file) {
        try {
          file = ts.createSourceFile(path, readFileSync(path, 'utf8'), languageVersion);
        } catch {
          return undefined;
        }
        libs.set(path, file);
      }
      return file;
    },
    getDefaultLibFileName: (o) => join(libDir, ts.getDefaultLibFileName(o)),
    getDefaultLibLocation: () => libDir,
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (f) => f in files,
    readFile: (f) => files[f],
  };
  const program = ts.createProgram(Object.keys(files), options, host);
  const file = program.getSourceFile('/snippet.ts') as ts.SourceFile;
  return [...program.getSyntacticDiagnostics(file), ...program.getSemanticDiagnostics(file)].map((d) => {
    const line = d.start !== undefined ? file.getLineAndCharacterOfPosition(d.start).line + 1 : 0;
    return `line ${line}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n').split('\n')[0]}`;
  });
}

describe('the generated typings', () => {
  it('check the sample snippet', () => {
    expect(errors(SAMPLE)).toEqual([]);
  });

  it('check the multi-state, MolScript and alias globals', () => {
    expect(
      errors(`
        const view: MVSBuilder = snapshot({ title: 'a', duration_ms: 500 });
        const s: MVSStructure = view.download({ url: 'x.cif' }).parse({ format: 'mmcif' }).modelStructure();
        const c: MVSComponent = s.component({ selector: molql('chain A', 'vmd') });
        const r: MVSRepresentation = c.representation({ type: 'surface' });
        const color: MVSColor = '#ff0000';
        r.color({ color });
        const expression: MVSExpression = { label_asym_id: 'A', beg_auth_seq_id: 10, end_auth_seq_id: 20 };
        s.component({ selector: [expression, { label_asym_id: 'B' }] });
        const same: typeof MolScriptBuilder = MolScriptBuilder;
        console.log(same);
      `),
    ).toEqual([]);
  });

  it('report an unknown representation type, at its line', () => {
    const found = errors(
      `${SAMPLE}builder.download({ url: 'x' }).parse({ format: 'bcif' }).modelStructure().component().representation({ type: 'cartoons' });\n`,
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatch(/^line 7: .*cartoons/);
  });

  it('report an unknown parameter and a wrong parse format', () => {
    const found = errors(`const s = builder.download({ url: 'x', uri: 'y' }).parse({ format: 'pdbx' });`);
    expect(found.length).toBeGreaterThan(0);
  });

  it('report an unknown name', () => {
    expect(errors('buildr.canvas({});')).toEqual([expect.stringContaining("Cannot find name 'buildr'")]);
  });

  it('declare const in two snippets without clashing (every file is a module)', () => {
    expect(errors('const x = 1;\nexport {};')).toEqual([]);
  });
});
