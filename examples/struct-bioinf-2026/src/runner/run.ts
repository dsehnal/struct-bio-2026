/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { MVSData } from '@molstar/mvs-builder';
import type { SeqViewSpecDoc } from '@molstar/seq-core/format';
import { locateError, snippetProgram } from './program.js';
import { type Runner, type RunOptions, SandboxRunner } from './sandbox.js';
import { transpile } from './transpile.js';
import { validateMvs, validateSvs } from './validate.js';

export interface SnippetError {
  message: string;
  /** 1-based line in the snippet; absent when the error is about the run as a whole. */
  line?: number;
}

/** The MVS data, ready for the viewer (single state, or multi-state when the snippet asked for snapshots), or the error. */
export type SnippetResult = { ok: true; mvs: MVSData } | { ok: false; error: SnippetError };

/** The SeqViewSpec document of an SVS snippet, validated, or the error. */
export type SvsSnippetResult = { ok: true; svs: SeqViewSpecDoc } | { ok: false; error: SnippetError };

function problem(message: string, line = 0): { ok: false; error: SnippetError } {
  return { ok: false, error: line > 0 ? { message, line } : { message } };
}

/** The page's address, which `asset(name)` in a snippet resolves against (not in a worker or a test without one). */
function pageAddress(): string | undefined {
  return typeof location === 'undefined' ? undefined : location.href;
}

/**
 * Runs a snippet with a runner (the sandbox in the page, anything in a test): TypeScript is transpiled and the program
 * runs in the sandbox; the data it returns is not yet checked.
 */
async function execute(
  runner: Runner,
  code: string,
  options: RunOptions,
): Promise<{ ok: true; data: unknown } | { ok: false; error: SnippetError }> {
  const transpiled = await transpile(code);
  if (!transpiled.ok) {
    const [first] = transpiled.problems;
    return problem(first.message, first.line);
  }
  const base = pageAddress();
  const outcome = await runner.run(snippetProgram(transpiled.js), { ...(base ? { base } : {}), ...options });
  if (!outcome.ok) {
    const located = locateError(outcome, transpiled.lines);
    return problem(located.message, located.line);
  }
  return outcome;
}

/** Runs MVS builder code and validates the tree it built. */
export async function runSnippetWith(runner: Runner, code: string, options: RunOptions = {}): Promise<SnippetResult> {
  const outcome = await execute(runner, code, { ...options, kind: 'mvs' });
  if (!outcome.ok) return outcome;
  const validated = validateMvs(outcome.data);
  if (!validated.ok) return problem(validated.issues.join('\n'));
  return { ok: true, mvs: validated.mvs };
}

/** Runs SeqViewSpec builder code and validates the document it built. */
export async function runSvsSnippetWith(
  runner: Runner,
  code: string,
  options: RunOptions = {},
): Promise<SvsSnippetResult> {
  const outcome = await execute(runner, code, { ...options, kind: 'svs' });
  if (!outcome.ok) return outcome;
  const validated = await validateSvs(outcome.data);
  if (!validated.ok) return problem(validated.issues.join('\n'));
  return { ok: true, svs: validated.svs };
}

let sandbox: SandboxRunner | undefined;
const shared = () => {
  sandbox ??= new SandboxRunner();
  return sandbox;
};

/**
 * Runs a snippet of MVS builder code (TypeScript) in the sandboxed iframe and returns the MVS data it built, validated,
 * or an error with the line in the snippet where it happened. The iframe is shared and starts on the first run.
 */
export function runSnippet(code: string): Promise<SnippetResult> {
  return runSnippetWith(shared(), code);
}

/** The same for SeqViewSpec builder code (`seq`): the validated document. */
export function runSvsSnippet(code: string): Promise<SvsSnippetResult> {
  return runSvsSnippetWith(shared(), code);
}
