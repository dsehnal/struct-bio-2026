/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { MVSData } from '@molstar/mvs-builder';
import { compileScript, MolScriptBuilder } from '@molstar/mvs-builder/molql';
import type { Root } from '@molstar/mvs-builder/tree/mvs/mvs-builder';
import { createSeqViewSpec } from '@molstar/seq-core/builder';

// What the sandbox runs (bundled into generated/runtime.ts by scripts/generate-runner.mjs); the tests import it directly.
// It runs a program made by `snippetProgram` (program.ts) with the globals the typings declare, and returns what the
// snippet built: MVS data, or a SeqViewSpec document (`kind`).

export type MolQLLanguage = 'pymol' | 'vmd' | 'jmol' | 'mol-script';

/**
 * A selection text as an MVS selector value, `{ molql }`: usable wherever the builder takes a selector. PyMOL by default.
 */
export function molql(text: string, language: MolQLLanguage = 'pymol'): { molql: unknown } {
  try {
    return { molql: JSON.parse(JSON.stringify(compileScript(language, text))) };
  } catch (e) {
    const why = (e instanceof Error ? e.message : String(e)).split('\n')[0];
    throw new Error(`molql("${text}") is not a ${language} selection Mol* reads: ${why}`);
  }
}

/**
 * A PyMOL selection as an MVS selector value: shorthand for `molql(text, 'pymol')`, compiled at once (a text Mol* cannot
 * read fails here, at the line of the call).
 */
export function pymol(text: string): { molql: unknown } {
  try {
    return { molql: JSON.parse(JSON.stringify(compileScript('pymol', text))) };
  } catch (e) {
    const why = (e instanceof Error ? e.message : String(e)).split('\n')[0];
    throw new Error(`pymol("${text}") is not a PyMOL selection Mol* reads: ${why}`);
  }
}

/** The names of the program's parameters, in order (program.ts declares the same). */
export const GLOBAL_NAMES = ['builder', 'molql', 'pymol', 'MolScriptBuilder', 'snapshot', 'seq', 'asset'] as const;

/** What a snippet builds: an MVS tree (`builder`) or a SeqViewSpec document (`seq`). */
export type SnippetKind = 'mvs' | 'svs';

export interface ProgramOptions {
  /** The result: the state of `builder` (or of its snapshots), or the document of `seq`. Default `mvs`. */
  kind?: SnippetKind;
  /** The page's address, which `asset(name)` resolves the files of its `data/` folder against. */
  base?: string;
}

/** The address of a data file of the page: `data/<name>` under the page's own. */
export function assetUrl(name: string, base: string | undefined): string {
  if (!base) throw new Error(`asset("${name}") needs the address of the page, which this run has none of.`);
  return new URL(`data/${name}`, base).href;
}

/**
 * Runs the program and returns what it built, as plain data: the state of `builder` (or, when the code asked for
 * snapshots, the multi-state data of those), or the document of `seq`.
 */
export async function runProgram(program: string, options: ProgramOptions = {}): Promise<unknown> {
  const builder = MVSData.createBuilder();
  const snapshots: { builder: Root; metadata: Record<string, unknown> }[] = [];
  const snapshot = (metadata: Record<string, unknown> = {}): Root => {
    const next = MVSData.createBuilder();
    snapshots.push({ builder: next, metadata });
    return next;
  };
  const seq = createSeqViewSpec({ title: 'SeqViewSpec' });
  const asset = (name: string) => assetUrl(name, options.base);
  // biome-ignore lint/nursery/noImpliedEval: running the snippet is the sandbox's job (iframe with a null origin, no network).
  const run = new Function(...GLOBAL_NAMES, program) as (...args: unknown[]) => Promise<void>;
  await run(builder, molql, pymol, MolScriptBuilder, snapshot, seq, asset);
  const data =
    options.kind === 'svs'
      ? seq.getDocument()
      : snapshots.length
        ? MVSData.createMultistate(snapshots.map((s) => s.builder.getSnapshot(s.metadata)))
        : builder.getState();
  // Only data leaves the sandbox: functions and class instances are dropped here, not cloned.
  return JSON.parse(JSON.stringify(data));
}
