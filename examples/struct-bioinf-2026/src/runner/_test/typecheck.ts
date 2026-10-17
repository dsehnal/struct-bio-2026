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
import { MVS_TYPES } from '../generated/mvs-types.js';
import { SVS_TYPES } from '../generated/svs-types.js';
import type { SnippetKind } from '../runtime/core.js';

// The generated typings, checked the way Monaco's worker uses them (editor.ts): strict, ES2020, every file a module, the
// typings of the snippet's kind as one extra library beside the snippet.

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
const TYPINGS: Record<SnippetKind, string> = { mvs: MVS_TYPES, svs: SVS_TYPES };

/** TypeScript's errors for a snippet, as `line N: message`. */
export function typeErrors(code: string, kind: SnippetKind = 'mvs'): string[] {
  const files: Record<string, string> = { '/typings.d.ts': TYPINGS[kind], '/snippet.ts': code };
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
