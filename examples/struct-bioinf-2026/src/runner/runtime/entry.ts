/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { HostCalls } from '../host.js';
import { type ProgramOptions, runProgram } from './core.js';

// The iframe's script (bundled into generated/runtime.ts): answers the page's run requests. The iframe has a null origin
// and a CSP without network, so the code it runs can build a tree or a document and nothing else; the page gets data back, never
// objects or functions.

/** The page's answers to what the running program asked (`HostCalls`), by call id. */
const asked = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
let nextCall = 1;

/** A call to the page: the program waits for the answer, and the page stops counting the program's own time meanwhile. */
function callPage(id: number, call: string, params: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const callId = nextCall++;
    asked.set(callId, { resolve, reject });
    parent.postMessage({ id, call, callId, params }, '*');
  });
}

addEventListener('message', async (e: MessageEvent) => {
  const data = (e.data ?? {}) as { id?: unknown; program?: unknown; kind?: unknown; base?: unknown } & {
    callId?: unknown;
    ok?: unknown;
    result?: unknown;
    error?: unknown;
  };
  if (typeof data.callId === 'number') {
    const call = asked.get(data.callId);
    asked.delete(data.callId);
    if (data.ok === true) call?.resolve(data.result);
    else call?.reject(new Error(typeof data.error === 'string' ? data.error : 'The page could not answer.'));
    return;
  }
  const { id, program, kind, base } = data;
  if (typeof id !== 'number' || typeof program !== 'string') return;
  try {
    const host: HostCalls = { tmAlign: (input) => callPage(id, 'tmAlign', input) as ReturnType<HostCalls['tmAlign']> };
    const options: ProgramOptions = {
      kind: kind === 'svs' ? 'svs' : 'mvs',
      ...(typeof base === 'string' ? { base } : {}),
      host,
    };
    parent.postMessage({ id, ok: true, data: await runProgram(program, options) }, '*');
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    parent.postMessage({ id, ok: false, error: `${error.name}: ${error.message}`, stack: error.stack ?? '' }, '*');
  }
});
parent.postMessage({ ready: true }, '*');
