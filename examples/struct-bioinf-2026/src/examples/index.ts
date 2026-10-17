/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { BasicsExample } from './basics.js';
import { ImatinibExample } from './imatinib.js';
import { P53Example } from './p53.js';
import { SpikeExample } from './spike.js';
import type { Example, Snippet, SuggestedEdit } from './types.js';

// The examples both modes read (_spec/README.md decision 2), in the order of the playground's cards.

export type { Example, Snippet, SnippetKind, SuggestedEdit } from './types.js';

export const Examples: readonly Example[] = [BasicsExample, P53Example, ImatinibExample, SpikeExample];

/** The snippets of every example, flat. */
export const Snippets: readonly Snippet[] = Examples.flatMap((e) => e.snippets);

/** A snippet by its id (`p53-hotspots`); undefined for an unknown id. */
export function getSnippet(id: string): Snippet | undefined {
  return Snippets.find((s) => s.id === id);
}

/** The example a snippet belongs to. */
export function exampleOf(snippetId: string): Example | undefined {
  return Examples.find((e) => e.snippets.some((s) => s.id === snippetId));
}

/** The edits suggested for a snippet: its own, or for the first snippet of an example the example's. */
export function editsOf(snippetId: string): readonly SuggestedEdit[] {
  const example = exampleOf(snippetId);
  const snippet = getSnippet(snippetId);
  if (!example || !snippet) return [];
  return snippet.edits ?? (example.snippets[0] === snippet ? example.edits : []);
}
