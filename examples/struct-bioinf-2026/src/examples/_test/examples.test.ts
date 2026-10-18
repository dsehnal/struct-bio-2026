/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { describe, expect, it } from 'vitest';
import { runSnippetWith, runSvsSnippetWith } from '../../runner/run.js';
import { inProcessRunner } from '../../runner/_test/samples.js';
import { typeErrors } from '../../runner/_test/typecheck.js';
import { editsOf, Examples, exampleOf, getSnippet, Snippets } from '../index.js';

// Every snippet and every suggested edit runs (in process, no iframe and no network), builds data the viewer's own
// validation accepts, and type-checks against the typings the editor shows.

const everything = [
  ...Snippets.map((s) => ({ name: s.id, kind: s.kind, code: s.code })),
  ...Snippets.flatMap((s) =>
    editsOf(s.id).map((e) => ({ name: `${s.id}: ${e.title}`, kind: s.kind, code: e.code, base: s.code })),
  ),
];

describe('the examples', () => {
  it('have unique snippet ids, the four fixed examples and the ids the slides use', () => {
    expect(new Set(Snippets.map((s) => s.id)).size).toBe(Snippets.length);
    expect(Examples.map((e) => e.id)).toEqual(['basics', 'p53', 'imatinib', 'spike']);
    for (const id of [
      'basics-smallest',
      'basics-selectors',
      'basics-pymol',
      'basics-annotations',
      'basics-primitives',
      'p53-af-plddt',
      'p53-dna',
      'p53-hotspots',
      'p53-sequence',
      'imatinib-pocket',
      'imatinib-density',
      'spike-story',
    ]) {
      expect(getSnippet(id), id).toBeDefined();
      expect(exampleOf(id), id).toBeDefined();
    }
    expect(getSnippet('nonsense')).toBeUndefined();
  });

  it('give every example two or three edits for its first snippet, with a hint', () => {
    for (const e of Examples) {
      expect(e.edits.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.edits.length, e.id).toBeLessThanOrEqual(3);
      for (const edit of e.edits) {
        expect(edit.hint.length, edit.title).toBeGreaterThan(20);
        expect(edit.code, edit.title).not.toBe(e.snippets[0].code);
      }
    }
  });

  it.each(everything)('$name runs and validates', async ({ kind, code, base }) => {
    if (base !== undefined) expect(code).not.toBe(base);
    const result =
      kind === 'svs' ? await runSvsSnippetWith(inProcessRunner, code) : await runSnippetWith(inProcessRunner, code);
    expect(result.ok ? undefined : result.error).toBeUndefined();
  });

  it.each(everything)('$name type-checks against the typings', ({ kind, code }) => {
    expect(typeErrors(code, kind)).toEqual([]);
  });

  it('keeps the snippets in the order of the talk: pymol follows selectors', () => {
    const ids = Examples[0].snippets.map((s) => s.id);
    expect(ids.indexOf('basics-pymol')).toBe(ids.indexOf('basics-selectors') + 1);
  });

  it('reads the annotation files from the address the page gives (asset)', async () => {
    const result = await runSnippetWith(inProcessRunner, getSnippet('p53-hotspots')?.code ?? '');
    expect(JSON.stringify(result)).toContain('"uri":"http://localhost:5181/data/p53-hotspots.json"');
  });
});
