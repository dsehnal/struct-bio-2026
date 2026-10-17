/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { Viewer } from '@molstar/viewer';
// The classic UI's stylesheet, the one the viewer app bundles (`apps/viewer/src/index.ts` imports the same file, and
// the esbuild app script compiles it to `molstar.css`). Vite compiles it with `sass`. Every rule is under `.msp-*`
// (normalize is a mixin inside `.msp-plugin`), so it does not touch the deck.
import '@molstar/plugin-ui/skin/light.scss';

// The classic Mol* viewer (`Viewer` from `@molstar/viewer`) with its default UI, for the side-by-side slide. This module
// is imported dynamically (the viewer app with all its extensions is a chunk of its own), so only that slide pays for it.

export interface ClassicViewer {
  readonly viewer: Viewer;
  dispose(): void;
}

/** The classic viewer filling `container` (which needs a size and `position: relative`); `dispose()` frees its WebGL context. */
export async function createClassicViewer(container: HTMLElement): Promise<ClassicViewer> {
  const viewer = await Viewer.create(container, {
    // The defaults are the UI as people know it (PDBe, RCSB); these only fit the viewer into a slide: the app's default
    // layout is "expanded" (`position: fixed`, the whole window), and the expand button would switch to it.
    layoutIsExpanded: false,
    viewportShowExpand: false,
    viewportShowToggleFullscreen: false,
  });
  let disposed = false;
  return {
    viewer,
    dispose() {
      if (disposed) return;
      disposed = true;
      // `Viewer.dispose` -> `PluginContext.dispose` disposes the canvas and its WebGL context (and forces its loss);
      // the React root is not unmounted by `renderReact18`, so the DOM is dropped here.
      viewer.dispose();
      container.replaceChildren();
    },
  };
}
