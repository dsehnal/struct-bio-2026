/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { SuggestedEdit } from './types.js';

/**
 * A suggested edit as the base snippet with replacements applied (`[from, to]`, each `from` once). A `from` the base does
 * not contain throws, so a changed snippet cannot leave its edits silently pointing at nothing.
 */
export function edit(
  title: string,
  hint: string,
  base: string,
  ...replacements: readonly (readonly [string, string])[]
): SuggestedEdit {
  let code = base;
  for (const [from, to] of replacements) {
    if (!code.includes(from)) throw new Error(`The edit "${title}" does not apply: the code has no "${from}".`);
    code = code.replace(from, () => to);
  }
  return { title, hint, code };
}
