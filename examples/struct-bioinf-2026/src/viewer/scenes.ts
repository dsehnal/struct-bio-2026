/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { MVSData } from '@molstar/mvs-builder';
import type { EmbeddedViewer } from './index.js';

/**
 * The placeholder scene of both modes: 1CBS (cellular retinoic acid binding protein with retinoic acid) from the PDBe
 * binary CIF, the protein as cartoon and the ligand as ball-and-stick. The real examples are snippet files
 * (_spec/README.md decision 2) and replace it.
 */
export function smallestScene(): MVSData {
  const builder = MVSData.createBuilder();
  const structure = builder
    .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif' })
    .parse({ format: 'bcif' })
    .modelStructure();
  structure.component({ selector: 'polymer' }).representation({ type: 'cartoon' }).color({ color: '#4a78c2' });
  structure.component({ selector: 'ligand' }).representation({ type: 'ball_and_stick' }).color({ color: '#e07b39' });
  return builder.getState();
}

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

/** The source of `smallestScene` as the slides show it (a placeholder, until the snippets are files). */
export const SmallestSceneCode = `const builder = MVSData.createBuilder();
const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();
structure.component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '#4a78c2' });
structure.component({ selector: 'ligand' })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#e07b39' });
return builder.getState();`;
