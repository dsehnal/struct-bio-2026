/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { CodeEditor, CodeEditorOptions } from './editor.js';
import type { SnippetKind } from './runtime/core.js';
import type { CodeProblem } from './transpile.js';

// The code runner (_spec/README.md decision 3): `runSnippet` runs MVS builder code in a sandbox and returns validated MVS
// data, `runSvsSnippet` SeqViewSpec builder code; `createCodeEditor` is the Monaco editor with the builder's typings. The editor is loaded on first use, so a page
// that only runs snippets (the slides) does not load Monaco.

export type { CodeEditor, CodeEditorOptions, EditorTheme } from './editor.js';
export { runSnippet, runSvsSnippet, type SnippetError, type SnippetResult, type SvsSnippetResult } from './run.js';
export type { SnippetKind } from './runtime/core.js';
export type { CodeProblem } from './transpile.js';

/** The editor in `el`, with the snippet's typings; resolves when Monaco is loaded. */
export async function createCodeEditor(el: HTMLElement, options: CodeEditorOptions): Promise<CodeEditor> {
  const { createEditor } = await import('./editor.js');
  return createEditor(el, options);
}

/** TypeScript's errors in a snippet, through Monaco's worker (what the editor's squiggles show, for code not in one). */
export async function typeErrors(code: string, kind: SnippetKind = 'mvs'): Promise<CodeProblem[]> {
  return (await import('./editor.js')).typeErrors(code, kind);
}
