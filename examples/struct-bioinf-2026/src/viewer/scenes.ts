/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { MVSData } from '@molstar/mvs-builder';
import type { EmbeddedViewer } from './index.js';

/** Loads a scene and reports a failure on the viewer instead of throwing (the last scene that worked stays). */
export async function showScene(viewer: EmbeddedViewer, scene: MVSData | string): Promise<boolean> {
  viewer.setStatus('Loading…');
  try {
    await viewer.loadMvs(scene);
    viewer.setStatus(undefined);
    return true;
  } catch (e) {
    console.error(e);
    viewer.setStatus(`Could not load the scene: ${e instanceof Error ? e.message : String(e)}`, 'error');
    return false;
  }
}
