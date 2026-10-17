/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { MVSData } from '@molstar/mvs-builder';
import type { SeqViewSpecDoc } from '@molstar/seq-core/format';

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

export type ValidatedSvs = { ok: true; svs: SeqViewSpecDoc } | { ok: false; issues: string[] };

/**
 * The same for a SeqViewSpec: Seq*'s validation with the kernel and the Mol* adapter registered (the structure
 * provider `molstar:structure` and the services), loaded on first use.
 */
export async function validateSvs(data: unknown): Promise<ValidatedSvs> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, issues: ['The snippet built no SeqViewSpec.'] };
  }
  const [{ createRegistries, KernelRegistry, register, validate }, { MolstarSvsEntry }] = await Promise.all([
    import('@molstar/seq-core/format'),
    import('@molstar/prism-viewer/sequence/molstar'),
  ]);
  const registries = createRegistries();
  register(registries, [KernelRegistry, MolstarSvsEntry]);
  const issues = validate(data, registries).filter((i) => i.severity === 'error');
  if (issues.length) return { ok: false, issues: issues.slice(0, MAX_ISSUES).map((i) => `${i.path}: ${i.message}`) };
  return { ok: true, svs: data as SeqViewSpecDoc };
}
