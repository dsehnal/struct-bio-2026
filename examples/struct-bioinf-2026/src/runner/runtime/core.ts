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

// What the sandbox runs (bundled into generated/runtime.ts by scripts/generate-runner.mjs); the tests import it directly.
// It runs a program made by `snippetProgram` (program.ts) with the globals the typings declare, and returns the MVS data
// the snippet built.

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

/** The names of the program's parameters, in order (program.ts declares the same). */
export const GLOBAL_NAMES = ['builder', 'molql', 'MolScriptBuilder', 'snapshot'] as const;

/**
 * Runs the program and returns the MVS data it built, as plain data: the state of `builder`, or, when the code asked
 * for snapshots, the multi-state data of those.
 */
export async function runProgram(program: string): Promise<unknown> {
  const builder = MVSData.createBuilder();
  const snapshots: { builder: Root; metadata: Record<string, unknown> }[] = [];
  const snapshot = (metadata: Record<string, unknown> = {}): Root => {
    const next = MVSData.createBuilder();
    snapshots.push({ builder: next, metadata });
    return next;
  };
  // biome-ignore lint/nursery/noImpliedEval: running the snippet is the sandbox's job (iframe with a null origin, no network).
  const run = new Function(...GLOBAL_NAMES, program) as (...args: unknown[]) => Promise<void>;
  await run(builder, molql, MolScriptBuilder, snapshot);
  const data = snapshots.length
    ? MVSData.createMultistate(snapshots.map((s) => s.builder.getSnapshot(s.metadata)))
    : builder.getState();
  // Only data leaves the sandbox: functions and class instances are dropped here, not cloned.
  return JSON.parse(JSON.stringify(data));
}
