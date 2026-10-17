/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

// The two modes of the app (_spec/README.md decision 1), chosen by the URL: `?mode=slides` (the default, also for an
// unknown value) and `?mode=playground`.

export type Mode = 'slides' | 'playground';

export function modeFromSearch(search: string): Mode {
  return new URLSearchParams(search).get('mode') === 'playground' ? 'playground' : 'slides';
}

/** A relative link to a mode of this page (works under any sub-path, as the build's `base` is relative). */
export function modeHref(mode: Mode): string {
  return mode === 'slides' ? './' : `./?mode=${mode}`;
}
