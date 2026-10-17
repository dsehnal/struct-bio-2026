/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { part0 } from './parts/part0.js';
import { part1 } from './parts/part1.js';
import { part2 } from './parts/part2.js';
import { part3 } from './parts/part3.js';
import { part4 } from './parts/part4.js';
import { part5 } from './parts/part5.js';
import { part6 } from './parts/part6.js';
import { part7 } from './parts/part7.js';
import { part8 } from './parts/part8.js';

// The deck's markup, one function per part of the talk (outline.md has the talk; `parts/`). Every slide has speaker notes
// (`<aside class="notes">`, the S key). A `data-live="<scene>"` on a section marks a live slide: `live.ts` mounts the scene
// when the slide is shown and disposes it when the slide is left.

export function deckHtml(): string {
  return [part0, part1, part2, part3, part4, part5, part6, part7, part8].map((part) => part()).join('');
}
