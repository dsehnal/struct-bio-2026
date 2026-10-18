/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

// The snippets both modes read (_spec/README.md decision 2). An example is a starting snippet and the edits the
// playground suggests (outline.md §7); slides show a snippet by id and may run it in a live viewer.

/** What a snippet's code is: MVS builder code (run by the runner, shown by `load.mvs`), or SVS builder code. */
export type SnippetKind = 'mvs' | 'svs';

export interface Snippet {
  /** Unique across all examples, e.g. `p53-hotspots`; slides refer to snippets by this id. */
  readonly id: string;
  readonly kind: SnippetKind;
  readonly title: string;
  /** One or two sentences of plain text, for a participant who does not write code. */
  readonly summary: string;
  readonly code: string;
  /**
   * Suggested edits of this snippet, shown when it is open (the example's `edits` belong to its first snippet).
   */
  readonly edits?: readonly SuggestedEdit[];
}

/** A suggested change in the playground: what to try, and the code after it (the "show me" button). */
export interface SuggestedEdit {
  readonly title: string;
  readonly hint: string;
  readonly code: string;
}

export interface Example {
  /** `basics`, `p53`, `imatinib`, `spike`. */
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
  /** The snippets in the order the talk uses them; the first is the playground card's start. */
  readonly snippets: readonly Snippet[];
  /** Rising difficulty, applied to the first snippet. */
  readonly edits: readonly SuggestedEdit[];
}
