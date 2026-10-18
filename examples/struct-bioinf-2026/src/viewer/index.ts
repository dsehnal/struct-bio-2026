/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { MVSData } from '@molstar/mvs-builder';
import { DefaultPrismViewerSpec } from '@molstar/prism-viewer/default-spec';
import { LoadersFeature } from '@molstar/prism-viewer/features/loaders';
import { createPrismViewer } from '@molstar/prism-viewer/page';
import type { PrismViewerSpec } from '@molstar/prism-viewer/spec';
import type { PrismViewer } from '@molstar/prism-viewer/viewer';
import './viewer.css';

// The viewer both modes embed (_spec/README.md decision 6): Prism, over `DefaultPrismViewerSpec()` (viewer-spec.md §5).
// That spec already has what the talk needs: the `loaders` feature (`load.mvs`, `load.svs`) and the sequence band
// (sequence.md §6), and `agent: {}`. It has no `persist`, so nothing is stored in the browser and
// several viewers may live on a page (viewer-spec.md §2.6: a `persist.key` is claimed per live viewer and a second
// viewer with the same key is refused). Mol*'s extensions (the app's `FullPrismViewerSpec`) are not needed.

export interface EmbeddedViewer {
  readonly viewer: PrismViewer;
  /** A message over the viewer (loading, an error); `undefined` clears it. */
  setStatus(message: string | undefined, kind?: 'info' | 'error'): void;
  /** Replaces the scene with a MolViewSpec (`load.mvs`): an `MVSData` (the builder's `getState()`) or MVSJ text. */
  loadMvs(data: MVSData | string): Promise<void>;
  /** Loads a database entry (`load.entry`) with the viewer's default preset: `loadEntry('pdb', '1iep')`. */
  loadEntry(source: 'pdb' | 'afdb' | 'emdb', id: string): Promise<void>;
  /** Shows a SeqViewSpec document in the sequence band (`load.svs`): a document object or its JSON text. */
  loadSvs(doc: object | string): Promise<void>;
  dispose(): Promise<void>;
}

/** How much of Prism's UI an embedded viewer shows: `compact` (the rail behind a button) or `full` (the viewer as the app has it). */
export type EmbeddedLayout = 'compact' | 'full';

export interface EmbeddedViewerOptions {
  /** `compact` by default (the playground's and the code slides' small viewer). */
  readonly layout?: EmbeddedLayout;
}

/** The spec of an embedded viewer: the default, with a layout for a host page (`compact`: the rail behind a button). */
export function embeddedViewerSpec(layout: EmbeddedLayout = 'compact'): PrismViewerSpec {
  const base = DefaultPrismViewerSpec();
  // `load.mvs` and `load.svs` are the loaders feature's; the import also brings their types onto `viewer.api.load`.
  if (!base.extensions?.includes(LoadersFeature)) throw new Error('The default Prism spec has no loaders feature.');
  return {
    ...base,
    // The page drives the viewer (no Home while empty); the tool rail is hidden behind a button in the canvas's corner.
    options: { ui: { homeWhenEmpty: false, splash: 'off' } },
    ...(layout === 'compact' ? { ui: { layout: { compactRail: true } } } : {}),
  };
}

/**
 * A Prism viewer filling `container` (which needs a size). One per live slide is fine: each viewer has its own plugin
 * and `dispose()` frees it and empties the container.
 */
export async function createEmbeddedViewer(
  container: HTMLElement,
  options: EmbeddedViewerOptions = {},
): Promise<EmbeddedViewer> {
  return createEmbeddedViewerWith(container, embeddedViewerSpec(options.layout));
}

/** After the first load: time for its first frames before the box fades in. */
const RevealAfterLoadMs = 250;
/** A box whose first load has not ended by then is shown anyway. */
const RevealFallbackMs = 15_000;

/** As `createEmbeddedViewer`, over a spec of the caller's (the Prism tour adds the animation export). */
export async function createEmbeddedViewerWith(container: HTMLElement, spec: PrismViewerSpec): Promise<EmbeddedViewer> {
  // The viewer's target gets a shadow root, so a message over it is a sibling, not a child.
  container.classList.add('embedded-viewer', 'is-loading');
  // The whole box fades in once its first scene has drawn (a load done and a moment for its frames), so a slide never
  // shows the viewer assembling itself. An error shows at once; the fallback reveals a box whose load never ends.
  let revealed = false;
  const reveal = (delayMs = 0) => {
    if (revealed) return;
    revealed = true;
    setTimeout(() => container.classList.remove('is-loading'), delayMs);
  };
  const fallback = setTimeout(() => reveal(), RevealFallbackMs);
  const target = document.createElement('div');
  target.style.cssText = 'position: absolute; inset: 0';
  const status = document.createElement('div');
  status.className = 'viewer-status';
  container.replaceChildren(target, status);
  const setStatus: EmbeddedViewer['setStatus'] = (message, kind = 'info') => {
    status.textContent = message ?? '';
    status.dataset.kind = kind;
    status.hidden = !message;
    if (message && kind === 'error') reveal();
  };
  /** Runs a load; the first one to end, done or failed, reveals the box. */
  const loading = async <T>(load: () => Promise<T>): Promise<T> => {
    try {
      return await load();
    } finally {
      reveal(RevealAfterLoadMs);
    }
  };
  setStatus('Starting the viewer…');
  let viewer: PrismViewer;
  try {
    viewer = await createPrismViewer({ target, spec });
  } catch (e) {
    setStatus(`The viewer could not start: ${e instanceof Error ? e.message : String(e)}`, 'error');
    throw e;
  }
  setStatus(undefined);
  let disposed = false;

  const text = (data: object | string) => (typeof data === 'string' ? data : JSON.stringify(data));

  return {
    viewer,
    setStatus,
    async loadMvs(data) {
      const mvsj = typeof data === 'string' ? data : MVSData.toMVSJ(data);
      const result = await loading(() => viewer.api.load.mvs({ data: mvsj, format: 'mvsj' }));
      if (!result.ok) throw new Error(result.message);
    },
    async loadEntry(source, id) {
      const result = await loading(() => viewer.api.load.entry({ source, id }));
      if (!result.ok) throw new Error(result.message);
    },
    async loadSvs(doc) {
      const result = await loading(() => viewer.api.load.svs({ data: text(doc) }));
      if (!result.ok) throw new Error(result.message);
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(fallback);
      await viewer.dispose();
      container.replaceChildren();
    },
  };
}
