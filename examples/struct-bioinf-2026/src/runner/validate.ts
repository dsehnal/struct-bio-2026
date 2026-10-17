/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { MVSData } from '@molstar/mvs-builder';

// What comes out of the sandbox is untrusted data: it is a tree only when @molstar/mvs-builder says so, and only then
// does it go to the viewer.

/** How many issues are reported: the first ones are the cause, the rest follow from them. */
const MAX_ISSUES = 5;

export type Validated = { ok: true; mvs: MVSData } | { ok: false; issues: string[] };

export function validateMvs(data: unknown): Validated {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, issues: ['The snippet built no MVS data.'] };
  }
  // `noExtra`: a misspelled parameter is an issue here, not silently ignored by the viewer.
  const issues = MVSData.validationIssues(data as MVSData, { noExtra: true });
  if (issues) return { ok: false, issues: issues.slice(0, MAX_ISSUES) };
  return { ok: true, mvs: data as MVSData };
}
