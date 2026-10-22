/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { RUNTIME_JS } from './generated/runtime.js';
import { HOST_TIMEOUT_MS, type HostCalls, withTimeout } from './host.js';
import type { SnippetKind } from './runtime/core.js';

// Runs a program in a sandboxed iframe (_spec/README.md decision 3): a null origin (`sandbox="allow-scripts"` without
// allow-same-origin) and a Content Security Policy with no network (`default-src 'none'`; only the inline runtime and
// `new Function` may run). The runtime (the MVS and SeqViewSpec builders) is inlined through `srcdoc`, so nothing is fetched. Results cross
// as structured-cloned data; a program that runs too long is stopped by throwing the iframe away.

export type RunOutcome = { ok: true; data: unknown } | { ok: false; error: string; stack?: string };

export interface Runner {
  run(program: string, options?: RunOptions): Promise<RunOutcome>;
}

export interface RunOptions {
  timeoutMs?: number;
  /** What the program builds (default `mvs`). */
  kind?: SnippetKind;
  /** The page's address, for `asset(name)`. */
  base?: string;
  /** What the page answers to the snippet (`tmAlign`); a call without one is an error in the snippet. */
  host?: HostCalls;
}

export const DEFAULT_TIMEOUT_MS = 5000;

const CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'";

function srcdoc(): string {
  // Inside a <script> element nothing may read as its end tag.
  const js = RUNTIME_JS.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><script>${js}</script>`;
}

interface Pending {
  resolve: (outcome: RunOutcome) => void;
  host: HostCalls | undefined;
  timer: ReturnType<typeof setTimeout> | undefined;
  /** The snippet's own time left (ms), and since when it runs; paused (no timer) while the page answers a call. */
  left: number;
  since: number;
  calls: number;
  timeoutMs: number;
}

export class SandboxRunner implements Runner {
  private frame: HTMLIFrameElement | undefined;
  private ready: Promise<void> | undefined;
  private readonly pending = new Map<number, Pending>();
  private next = 1;

  private readonly onMessage = (e: MessageEvent) => {
    if (!this.frame || e.source !== this.frame.contentWindow) return;
    const data = (e.data ?? {}) as {
      id?: unknown;
      ok?: unknown;
      data?: unknown;
      error?: unknown;
      stack?: unknown;
      call?: unknown;
      callId?: unknown;
      params?: unknown;
    };
    const pending = typeof data.id === 'number' ? this.pending.get(data.id) : undefined;
    if (!pending || typeof data.id !== 'number') return;
    if (typeof data.call === 'string' && typeof data.callId === 'number') {
      void this.answer(data.id, pending, data.call, data.callId, data.params);
      return;
    }
    this.pending.delete(data.id);
    clearTimeout(pending.timer);
    pending.resolve(
      data.ok === true
        ? { ok: true, data: data.data }
        : {
            ok: false,
            error: typeof data.error === 'string' ? data.error : 'The code failed.',
            ...(typeof data.stack === 'string' && data.stack ? { stack: data.stack } : {}),
          },
    );
  };

  /** The snippet's time runs only while it runs: stopped while the page answers, started again with the answer. */
  private arm(id: number, pending: Pending): void {
    pending.since = Date.now();
    pending.timer = setTimeout(() => this.expire(id, pending), Math.max(pending.left, 0));
  }

  private expire(id: number, pending: Pending): void {
    this.pending.delete(id);
    this.reset();
    pending.resolve({ ok: false, error: `The code ran for more than ${pending.timeoutMs / 1000} s and was stopped.` });
  }

  /** Answers a call of the snippet to the page (`HostCalls`) with its own, longer limit. */
  private async answer(id: number, pending: Pending, call: string, callId: number, params: unknown): Promise<void> {
    if (pending.calls++ === 0) {
      clearTimeout(pending.timer);
      pending.left -= Date.now() - pending.since;
    }
    let reply: { ok: true; result: unknown } | { ok: false; error: string };
    try {
      if (call !== 'tmAlign' || !pending.host) throw new Error(`The page cannot answer "${call}" here.`);
      const host = pending.host;
      const result = await withTimeout(
        host.tmAlign(params as Parameters<HostCalls['tmAlign']>[0]),
        HOST_TIMEOUT_MS,
        `It took more than ${HOST_TIMEOUT_MS / 1000} s (the download and the alignment) and was stopped.`,
      );
      reply = { ok: true, result };
    } catch (e) {
      reply = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    // The run may be over meanwhile (stopped, or the iframe thrown away).
    if (this.pending.get(id) !== pending) return;
    if (--pending.calls === 0) this.arm(id, pending);
    this.frame?.contentWindow?.postMessage({ callId, ...reply }, '*');
  }

  private start(): Promise<void> {
    if (this.ready) return this.ready;
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.display = 'none';
    frame.srcdoc = srcdoc();
    this.frame = frame;
    window.addEventListener('message', this.onMessage);
    this.ready = new Promise((resolve) => {
      const onReady = (e: MessageEvent) => {
        if (e.source !== frame.contentWindow || !(e.data as { ready?: boolean } | null)?.ready) return;
        window.removeEventListener('message', onReady);
        resolve();
      };
      window.addEventListener('message', onReady);
    });
    document.body.append(frame);
    return this.ready;
  }

  /** Throws the iframe away (stops whatever runs in it); the next run starts a new one. */
  private reset(): void {
    this.frame?.remove();
    this.frame = undefined;
    this.ready = undefined;
    window.removeEventListener('message', this.onMessage);
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.resolve({ ok: false, error: 'Stopped.' });
    }
    this.pending.clear();
  }

  async run(program: string, options: RunOptions = {}): Promise<RunOutcome> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    // The timer starts with the run: a runtime that never reports ready (a blocked iframe) is stopped as well.
    return new Promise<RunOutcome>((resolve) => {
      const id = this.next++;
      const pending: Pending = {
        resolve,
        host: options.host,
        timer: undefined,
        left: timeoutMs,
        since: 0,
        calls: 0,
        timeoutMs,
      };
      this.pending.set(id, pending);
      this.arm(id, pending);
      this.start().then(() =>
        this.frame?.contentWindow?.postMessage({ id, program, kind: options.kind, base: options.base }, '*'),
      );
    });
  }

  dispose(): void {
    this.reset();
  }
}
