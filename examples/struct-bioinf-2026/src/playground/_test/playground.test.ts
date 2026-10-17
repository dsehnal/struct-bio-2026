/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { describe, expect, it } from 'vitest';
import { Snippets } from '../../examples/index.js';
import { plainError } from '../errors.js';
import { DEFAULT_SNIPPET, snippetFromSearch } from '../link.js';

describe('the playground link', () => {
  it('opens the snippet it names', () => {
    for (const s of Snippets) {
      expect(snippetFromSearch(`?mode=playground&snippet=${s.id}`).id).toBe(s.id);
    }
  });

  it('opens the smallest scene for no snippet or an unknown one', () => {
    expect(snippetFromSearch('?mode=playground').id).toBe(DEFAULT_SNIPPET);
    expect(snippetFromSearch('?mode=playground&snippet=nonsense').id).toBe(DEFAULT_SNIPPET);
    expect(snippetFromSearch('').id).toBe('basics-smallest');
  });
});

describe('plainError', () => {
  it('explains a misspelled name and a missing step, keeping the original message', () => {
    expect(plainError('ReferenceError: buildr is not defined')).toMatch(/^"buildr" is not a name .*Check the spelling/);
    const step = plainError('TypeError: structure.component(...).label is not a function');
    expect(step).toMatch(/^"label" is not a step/);
    expect(step).toContain('structure.component(...).label is not a function');
  });

  it('leaves other messages as they are', () => {
    expect(plainError('Error: boom')).toBe('Error: boom');
  });
});
