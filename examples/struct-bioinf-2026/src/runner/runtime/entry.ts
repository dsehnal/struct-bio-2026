/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { runProgram } from './core.js';

// The iframe's script (bundled into generated/runtime.ts): answers the page's run requests. The iframe has a null origin
// and a CSP without network, so the code it runs can build a tree or a document and nothing else; the page gets data back, never
// objects or functions.

addEventListener(
  'message',
  async (e: MessageEvent<{ id?: unknown; program?: unknown; kind?: unknown; base?: unknown }>) => {
    const { id, program, kind, base } = e.data ?? {};
    if (typeof id !== 'number' || typeof program !== 'string') return;
    try {
      const options = { kind: kind === 'svs' ? 'svs' : 'mvs', ...(typeof base === 'string' ? { base } : {}) } as const;
      parent.postMessage({ id, ok: true, data: await runProgram(program, options) }, '*');
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      parent.postMessage({ id, ok: false, error: `${error.name}: ${error.message}`, stack: error.stack ?? '' }, '*');
    }
  },
);
parent.postMessage({ ready: true }, '*');
