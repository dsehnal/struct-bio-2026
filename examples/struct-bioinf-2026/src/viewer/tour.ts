/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { LazyVideoExport } from '@molstar/video-export-extension/prism-viewer-stub';
import { createEmbeddedViewerWith, type EmbeddedViewer, embeddedViewerSpec } from './index.js';

// The viewer of the Prism tour (outline.md §1): the full layout, with the animation (MP4, WebM) export the app has. The
// extension is its lazy stub (`prism-viewer-stub`: plain data), so the encoder and the views load when the Export card asks
// for the Animation section, and only on this slide: the playground's viewer does not list it.

export async function createTourViewer(container: HTMLElement): Promise<EmbeddedViewer> {
  const base = embeddedViewerSpec('full');
  return createEmbeddedViewerWith(container, { ...base, extensions: [...(base.extensions ?? []), LazyVideoExport] });
}

/** The section of the Export card that the video export adds (`VideoSection` of the extension's stub). */
export { VideoSection } from '@molstar/video-export-extension/prism-viewer-stub';
