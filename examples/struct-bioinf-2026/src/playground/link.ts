/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { getSnippet, type Snippet } from '../examples/index.js';

// The playground's deep links: `?mode=playground&snippet=<id>` (the slides' "try it" chips).

export const DEFAULT_SNIPPET = 'basics-smallest';

/** The snippet a link asks for (`?snippet=<id>`); an unknown or missing id opens the smallest scene. */
export function snippetFromSearch(search: string): Snippet {
  const id = new URLSearchParams(search).get('snippet');
  return (id ? getSnippet(id) : undefined) ?? (getSnippet(DEFAULT_SNIPPET) as Snippet);
}
