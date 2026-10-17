/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { CodeProblem } from './transpile.js';

// The program the sandbox runs and the way back from an error in it to a line of the snippet.

/**
 * The body of the function `new Function(...GLOBAL_NAMES, body)` makes (runtime/core.ts passes the same names). The
 * snippet runs in an async arrow of its own, so its `const builder` or `await` do not clash with the parameters. The
 * header is one line, so snippet JS line k is body line k + 1; `sourceURL` names the frames.
 */
export function snippetProgram(js: string): string {
  return `return (async () => {\n${js}\n})();\n//# sourceURL=${SOURCE_URL}`;
}

export const SOURCE_URL = 'mvs-snippet.js';

/**
 * `new Function` puts two lines (the signature and its closing parenthesis) before the body, as the language defines
 * (Function.prototype.toString), and the body's own header is one more: a frame's line minus this is the JS line.
 */
const FRAME_OFFSET = 3;

/**
 * Where a run-time error happened: the first frame in the snippet, mapped through the transpiled lines. Without a
 * frame (a browser that does not name them, or an error from the run as a whole) there is no line.
 */
export function locateError(run: { error: string; stack?: string }, lines: readonly number[]): CodeProblem {
  const frames = [...(run.stack ?? '').matchAll(new RegExp(`${SOURCE_URL.replace('.', '\\.')}:(\\d+):\\d+`, 'g'))];
  for (const frame of frames) {
    const js = Number(frame[1]) - FRAME_OFFSET;
    if (js < 1 || js > lines.length) continue;
    // A JS line without a source line (erasing types can leave one) takes the nearest one above.
    let i = js - 1;
    while (i > 0 && !lines[i]) i--;
    return { line: lines[i] || 0, message: run.error };
  }
  return { line: 0, message: run.error };
}
