/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { MVSData } from '@molstar/mvs-builder';
import { locateError, snippetProgram } from './program.js';
import { type Runner, SandboxRunner } from './sandbox.js';
import { transpile } from './transpile.js';
import { validateMvs } from './validate.js';

export interface SnippetError {
  message: string;
  /** 1-based line in the snippet; absent when the error is about the run as a whole. */
  line?: number;
}

/** The MVS data, ready for the viewer (single state, or multi-state when the snippet asked for snapshots), or the error. */
export type SnippetResult = { ok: true; mvs: MVSData } | { ok: false; error: SnippetError };

function problem(message: string, line = 0): { ok: false; error: SnippetError } {
  return { ok: false, error: line > 0 ? { message, line } : { message } };
}

/**
 * Runs a snippet with a runner (the sandbox in the page, anything in a test): TypeScript is transpiled, the program runs
 * in the sandbox, and the data it returns is validated.
 */
export async function runSnippetWith(
  runner: Runner,
  code: string,
  options: { timeoutMs?: number } = {},
): Promise<SnippetResult> {
  const transpiled = await transpile(code);
  if (!transpiled.ok) {
    const [first] = transpiled.problems;
    return problem(first.message, first.line);
  }
  const outcome = await runner.run(snippetProgram(transpiled.js), options);
  if (!outcome.ok) {
    const located = locateError(outcome, transpiled.lines);
    return problem(located.message, located.line);
  }
  const validated = validateMvs(outcome.mvs);
  if (!validated.ok) return problem(validated.issues.join('\n'));
  return { ok: true, mvs: validated.mvs };
}

let sandbox: SandboxRunner | undefined;

/**
 * Runs a snippet of MVS builder code (TypeScript) in the sandboxed iframe and returns the MVS data it built, validated,
 * or an error with the line in the snippet where it happened. The iframe is shared and starts on the first run.
 */
export function runSnippet(code: string): Promise<SnippetResult> {
  sandbox ??= new SandboxRunner();
  return runSnippetWith(sandbox, code);
}
