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

/**
 * A link to a mode of this page, from the build's base (`import.meta.env.BASE_URL`): absolute in the GitHub Pages build
 * (`build:pages`), so it holds whatever the page's own address is (with or without its trailing slash); relative (`./`)
 * in the plain build, for any folder.
 */
export function modeHref(mode: Mode): string {
  const base = import.meta.env.BASE_URL;
  return mode === 'slides' ? base : `${base}?mode=${mode}`;
}
